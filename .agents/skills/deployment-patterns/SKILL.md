---
name: deployment-patterns
description: 部署模式 — CI/CD 流水线、蓝绿部署、金丝雀发布、回滚策略、健康检查。
---

# 部署模式参考

现代软件部署的核心模式和最佳实践。

## CI/CD 流水线设计

```yaml
# GitHub Actions 完整流水线
name: Deploy Pipeline
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: registry/myapp:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - run: kubectl set image deployment/myapp myapp=registry/myapp:${{ github.sha }} -n staging

  deploy-prod:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: kubectl set image deployment/myapp myapp=registry/myapp:${{ github.sha }} -n production
```

GitLab CI 类似结构: stages 定义阶段 | only/except 控制触发 | artifacts 传递构建产物

## 蓝绿部署

```
                    ┌─────────────┐
          ┌────────▶│  Blue (v1)  │  ← 当前生产流量
          │         └─────────────┘
负载均衡器 ─┤
          │         ┌─────────────┐
          └────────▶│  Green (v2) │  ← 新版本 (无流量)
                    └─────────────┘

步骤:
1. 部署 Green 环境 (新版本)
2. 在 Green 上运行烟雾测试
3. 切换负载均衡器: Blue → Green
4. 监控错误率 5-15 分钟
5. 发现问题 → 切回 Blue (秒级回滚)
6. 确认无误 → 下线旧 Blue 环境
```

优点: 零停机 | 秒级回滚 | 完整环境验证
缺点: 需要双倍资源 | 数据库迁移需向前兼容

## 金丝雀发布

```yaml
# Kubernetes 金丝雀 - 逐步增加流量
apiVersion: argoproj.io/v1alpha1
kind: Rollout
spec:
  strategy:
    canary:
      steps:
        - setWeight: 5       # 5% 流量到新版本
        - pause: { duration: 5m }
        - setWeight: 20      # 20% 流量
        - pause: { duration: 5m }
        - setWeight: 50      # 50% 流量
        - pause: { duration: 10m }
        - setWeight: 100     # 全量发布
      canaryService: myapp-canary
      stableService: myapp-stable
```

关键指标监控: 错误率 > 1% 自动回滚 | P99 延迟 > 基线 50% 回滚 | 自定义业务指标

## 滚动更新

```yaml
# Kubernetes Deployment 滚动更新
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2          # 最多多启动 2 个 Pod
      maxUnavailable: 1    # 最多 1 个 Pod 不可用
  # 确保始终有足够实例服务流量
```

默认策略，适合无状态服务。逐步替换旧 Pod，保证可用性。

## 回滚策略

```bash
# Kubernetes 快速回滚
kubectl rollout undo deployment/myapp              # 回滚到上一版本
kubectl rollout undo deployment/myapp --to-revision=3  # 回滚到指定版本

# Docker 回滚
docker service rollback myapp

# 数据库回滚 (需要预先准备)
# 1. 每次部署前备份
# 2. 迁移脚本必须有 down()
# 3. 回滚应用版本 + 回滚数据库迁移
```

原则: 回滚必须是默认操作 | 自动化回滚优于手动 | 回滚脚本定期演练

## 健康检查 (Liveness / Readiness)

```yaml
# Kubernetes 健康检查
spec:
  containers:
    - name: myapp
      # 存活检查 - 失败则重启容器
      livenessProbe:
        httpGet: { path: /health/live, port: 3000 }
        initialDelaySeconds: 10
        periodSeconds: 15
        failureThreshold: 3

      # 就绪检查 - 失败则从 Service 摘除
      readinessProbe:
        httpGet: { path: /health/ready, port: 3000 }
        initialDelaySeconds: 5
        periodSeconds: 10
        failureThreshold: 3
```

```typescript
// 健康检查端点实现
app.get("/health/live", (req, res) => res.send("ok"));        // 进程存活

app.get("/health/ready", async (req, res) => {                // 服务就绪
  const checks = {
    database: await db.ping(),
    redis: await redis.ping(),
  };
  const allHealthy = Object.values(checks).every(Boolean);
  res.status(allHealthy ? 200 : 503).json(checks);
});
```

## 环境管理 (Dev / Staging / Prod)

```
dev      → 开发环境，每次 push 自动部署，可破坏
staging  → 预发布环境，与生产配置一致，集成测试
prod     → 生产环境，需要人工审批，金丝雀发布

配置外置原则:
- 代码不包含环境特定配置
- 环境变量 / 配置中心管理差异
- 同一个镜像跨所有环境运行
```

## Feature Flags

```typescript
// 功能开关 - 解耦部署和发布
if (featureFlags.isEnabled("new-checkout", { userId: user.id })) {
  return newCheckoutFlow(cart);
}
return legacyCheckoutFlow(cart);

// 发布策略
// 1. 内部用户 100%
// 2. Beta 用户 10%
// 3. 全量用户 100%
// 4. 移除 feature flag 代码
```

工具: LaunchDarkly | Unleash | 自建 (Redis + 百分比分桶)
