---
name: taozi-router
description: Taozi 智能调度入口。用户任务不明确、需要选择最优工作流或子代理时使用。
---

# Taozi Router

## 目标

把用户请求路由到最合适的 Taozi 工作流或专业子代理。

## 路由规则

- 新功能、端到端实现: `fullstack-developer`
- Bug、报错、异常定位: `debugger`
- 架构、方案、拆分任务: `architect` 或 `planner`
- 代码审查、质量把关: `code-reviewer`
- 安全扫描: `security-reviewer`
- 测试设计、TDD: `testing-engineer` 或 `tdd-guide`
- 文档同步: `documentation-engineer` 或 `doc-updater`

## 决策原则

- 简单任务直接执行，不做过度编排
- 复杂任务先做计划，再并行拆分
- 当用户要“方案”时，不直接开始大改
- 当用户要“实现”时，默认推进到代码和验证

## 输出

- 识别的任务类型
- 选择的工作流或子代理
- 为什么这样路由
- 下一步要做什么
