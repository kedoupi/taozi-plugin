---
name: multi-plan
description: 多 Agent 协作规划 — 将复杂任务分解为可并行的子任务，分配给不同 Agent
allowed-tools: Read, Grep, Glob, Bash
argument-hint: [任务描述]
---

# Multi-Plan

将复杂任务 `$ARGUMENTS` 分解为可并行执行的子任务图，分配给最适合的 Agent。

## 何时使用

- 任务跨多个模块或层次
- 既要实现，又要测试、审查、文档同步
- 用户明确要求并行、多代理、分工协作

## 拆分原则

- 子任务要有清晰输入和输出
- 写入范围尽量互不重叠
- 阻塞主路径的工作不要轻易外包
- 审查和验证任务适合并行跟进
- 子任务粒度：一个 Agent 可在单次执行中完成

## 执行步骤

### 1. 理解任务

```
解析维度:
- 任务目标: 最终要交付什么
- 技术领域: 涉及哪些技术栈
- 复杂度: 简单/中等/复杂
- 约束条件: 时间/技术/资源限制
```

### 2. 读取项目上下文

```bash
ls -la
cat package.json 2>/dev/null || cat Cargo.toml 2>/dev/null || cat go.mod 2>/dev/null
find src -type f -name "*.ts" -o -name "*.tsx" | head -30
```

### 3. 任务分解

- 识别必须串行的关键路径
- 找出可以并行的探索、实现、验证任务
- 指定每个子任务的责任范围

### 4. Agent 分配

| Agent | 适用场景 |
|-------|---------|
| fullstack-developer | 功能开发、API 实现、前后端编码 |
| architect | 架构设计、技术选型、系统分析 |
| planner | 需求分解、任务规划 |
| tdd-guide | 测试驱动开发、测试编写 |
| e2e-runner | E2E 测试、Playwright 测试 |
| code-reviewer | 代码审查、安全审计 |
| doc-updater | 文档更新、README 维护 |
| refactor-cleaner | 代码清理、依赖清理 |
| build-error-resolver | 构建错误修复、类型错误 |
| security-reviewer | 安全漏洞检测、依赖审计 |
| debugger | Bug 诊断、错误分析 |
| testing-engineer | 测试策略、测试覆盖 |
| performance-engineer | 性能分析、优化 |

### 5. 生成执行计划

输出到 `.claude/multi-plan.md`：

```markdown
# 多 Agent 执行计划

## 任务描述
$ARGUMENTS

## 子任务列表

### Group A (可并行)
- **T1**: [任务描述]
  - Agent: fullstack-developer
  - 输入: [依赖的文件/信息]
  - 输出: [交付物]
  - 预计文件: [涉及文件路径]

- **T2**: [任务描述]
  - Agent: tdd-guide
  - 输入 / 输出 / 文件

### Group B (依赖 Group A)
- **T3**: [任务描述]
  - Agent: fullstack-developer
  - 依赖: T1, T2

### Group C (依赖 Group B)
- **T4**: 代码审查 — Agent: code-reviewer, 依赖: T3
- **T5**: 文档同步 — Agent: doc-updater, 依赖: T3

## 执行依赖图
T1 ──┐
     ├──→ T3 ──┬──→ T4
T2 ──┘         └──→ T5

## 预计时间线
- Group A: 并行执行
- Group B: Group A 完成后
- Group C: Group B 完成后
```

## 输出

1. 生成 `.claude/multi-plan.md` 执行计划文件
2. 输出摘要到控制台
3. 提示用户运行 `/taozi:multi-execute .claude/multi-plan.md` 开始执行

## 使用示例

```bash
/taozi:multi-plan 实现用户认证系统，包括注册、登录、JWT、权限控制
/taozi:multi-plan 优化首页加载性能，从 3s 降到 1s 以内
/taozi:multi-plan 对支付模块做全面重构，包括类型安全、测试覆盖、文档更新
```
