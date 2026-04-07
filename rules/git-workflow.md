# Git 工作流规范

> 规范的提交历史就是最好的文档。

## 提交格式 (Conventional Commits)

```
<type>(<scope>): <description>

[可选的详细说明]

[可选的 breaking changes]
```

### Type 类型

| Type | 用途 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(auth): 添加 JWT 刷新机制` |
| `fix` | Bug 修复 | `fix(api): 修复分页偏移计算错误` |
| `refactor` | 重构（不改行为） | `refactor(db): 抽取查询构建器` |
| `docs` | 文档 | `docs: 更新 API 使用说明` |
| `test` | 测试 | `test(auth): 补充登录边界测试` |
| `chore` | 杂项 | `chore: 升级依赖到最新版` |
| `perf` | 性能优化 | `perf(list): 虚拟滚动优化` |

### 提交信息原则

- 描述 **why**（为什么改），而非 what（改了什么）— 代码 diff 已经展示了 what
- 一个提交一个逻辑变更；不要把无关改动混在一起
- 用中文或英文保持一致，不要混用

```bash
# 推荐
git commit -m "fix(order): 修复并发下单库存超卖问题

reason: 原实现缺少行级锁，高并发下可能卖出超过实际库存"

# 避免
git commit -m "fix bug"
git commit -m "update code"
git commit -m "fix stuff and also add feature"
```

## 分支规范

| 分支类型 | 命名格式 | 示例 |
|----------|----------|------|
| 功能 | `feat/<简述>` | `feat/user-auth` |
| 修复 | `fix/<简述>` | `fix/pagination-offset` |
| 重构 | `refactor/<简述>` | `refactor/extract-query-builder` |
| 发布 | `release/<版本>` | `release/v2.1.0` |

## PR 流程

1. 从 `main` 创建 feature branch
2. 开发完成后推送并创建 PR
3. PR 标题遵循 Conventional Commits 格式
4. PR 描述包含：变更原因、影响范围、测试方式
5. 至少一人 review 通过后合并
6. 合并后删除 feature branch

## 禁止行为

- 直接在 `main` 上提交（紧急 hotfix 除外）
- 提交包含敏感信息（密钥、密码、token）
- 一个 PR 包含超过 3 个不相关功能
- force push 到共享分支
- 合并后不删除 feature branch
