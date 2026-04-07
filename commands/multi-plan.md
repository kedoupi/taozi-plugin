---
name: taozi:multi-plan
description: 多 Agent 协作规划 — 将复杂任务分解为可并行的子任务，分配给不同 Agent
allowed-tools: Read, Grep, Glob, Bash
argument-hint: [任务描述]
---

# Taozi Multi-Plan - 多 Agent 协作规划

将复杂任务分解为可并行执行的子任务图，分配给最适合的 Agent，生成结构化的执行计划。

## 执行步骤

### 1. 理解任务

分析 `$ARGUMENTS` 中的任务描述：

```
解析维度:
- 任务目标: 最终要交付什么
- 技术领域: 涉及哪些技术栈
- 复杂度: 简单/中等/复杂
- 约束条件: 时间/技术/资源限制
```

### 2. 读取项目上下文

```bash
# 了解项目结构
ls -la
# 查看技术栈
cat package.json 2>/dev/null || cat Cargo.toml 2>/dev/null || cat go.mod 2>/dev/null
# 查看现有代码组织
find src -type f -name "*.ts" -o -name "*.tsx" | head -30
```

### 3. 任务分解

将任务拆分为可独立执行的子任务：

```
分解原则:
- 每个子任务有明确的输入和输出
- 子任务粒度: 一个 Agent 可在单次执行中完成
- 识别子任务间的依赖关系
- 标注哪些子任务可以并行执行
```

### 4. Agent 分配

根据子任务特点选择最合适的 Agent：

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

输出计划文件到 `.claude/multi-plan.md`：

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
  - 预计文件: [涉及的文件路径]

- **T2**: [任务描述]
  - Agent: tdd-guide
  - 输入: [依赖的文件/信息]
  - 输出: [交付物]
  - 预计文件: [涉及的文件路径]

### Group B (依赖 Group A)
- **T3**: [任务描述]
  - Agent: fullstack-developer
  - 依赖: T1, T2
  - 输入: [依赖的文件/信息]
  - 输出: [交付物]

### Group C (依赖 Group B)
- **T4**: [任务描述]
  - Agent: code-reviewer
  - 依赖: T3
  - 输入: [所有变更文件]
  - 输出: [审查报告]

- **T5**: [任务描述]
  - Agent: doc-updater
  - 依赖: T3
  - 输入: [所有变更文件]
  - 输出: [更新的文档]

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
3. 提示用户运行 `/multi-execute .claude/multi-plan.md` 开始执行

## 使用示例

```bash
# 复杂功能开发
/multi-plan 实现用户认证系统，包括注册、登录、JWT、权限控制

# 系统优化
/multi-plan 优化首页加载性能，从 3s 降到 1s 以内

# 全面的代码改进
/multi-plan 对支付模块做全面重构，包括类型安全、测试覆盖、文档更新
```
