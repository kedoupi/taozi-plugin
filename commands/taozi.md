---
name: taozi
description: Taozi 2.1 智能调度 - 意图理解 + 工作流匹配 + 3 条铁律
allowed-tools: Task
argument-hint: <任务描述>
---

# Taozi 2.1 智能调度

分析用户任务，匹配最佳工作流或直接调度 Agent 执行：`$ARGUMENTS`

## 调度逻辑

### 1. 意图识别
分析用户输入，识别：
- 任务类型（开发/修复/优化/审查/文档）
- 复杂度（简单/中等/复杂）
- 涉及领域（前端/后端/全栈/数据库）

### 2. 工作流匹配
优先匹配预定义工作流，无匹配则直接调度 Agent

### 3. 执行模式
- **简单任务**: 单 Agent 执行
- **复杂任务**: 工作流多步骤执行

## 可用工作流

| 工作流 | 触发关键词 | 执行 Agent |
|--------|-----------|-----------|
| feature-development | 功能, 实现, 开发, 新增, 添加 | fullstack → testing |
| bug-fixing | Bug, 错误, 报错, 修复, 问题 | debugger → testing |
| code-review | 审查, review, 检查代码 | code-reviewer |
| performance-tuning | 性能, 优化, 慢, 加载 | performance → fullstack |
| refactoring | 重构, 改进, 清理, 整理 | refactoring → testing |
| documentation | 文档, README, 注释 | documentation |

## 核心 Agents

### 执行层
| Agent | 专长 | 模型 |
|-------|------|------|
| fullstack-developer | 端到端开发、完整功能实现 | Opus |
| devops-engineer | CI/CD、Docker、K8s、部署 | Sonnet |
| debugger | Bug 诊断、错误分析、问题排查 | Opus |

### 质量层
| Agent | 专长 | 模型 |
|-------|------|------|
| code-reviewer | 代码质量、安全性审查 | Sonnet |
| testing-engineer | 测试策略、TDD、覆盖率 | Sonnet |

### 优化层
| Agent | 专长 | 模型 |
|-------|------|------|
| refactoring-specialist | 代码重构、设计模式 | Sonnet |
| performance-engineer | 性能分析、优化调优 | Sonnet |

### 支撑层
| Agent | 专长 | 模型 |
|-------|------|------|
| documentation-engineer | 技术文档、API 文档 | Sonnet |
| context-manager | 上下文优化、CLAUDE.md 管理 | Sonnet |
| prompt-engineer | LLM 提示优化、AI 系统设计 | Opus |

## 关键词 → 路由映射

```
开发/实现/添加/创建/新功能     → workflow: feature-development
Bug/错误/报错/修复/异常/崩溃   → workflow: bug-fixing
审查/review/检查代码/质量     → workflow: code-review
性能/优化/慢/卡顿/加载         → workflow: performance-tuning
重构/改进/清理/整理/技术债务   → workflow: refactoring
文档/README/API文档/注释      → workflow: documentation

CI/CD/Docker/K8s/部署/运维   → agent: devops-engineer
AI/提示/LLM/Agent/MCP        → agent: prompt-engineer
上下文/CLAUDE.md/优化文档     → agent: context-manager

# 无明确匹配时的默认选择
代码相关 → fullstack-developer
测试相关 → testing-engineer
```

## 执行流程

### 工作流执行
```
1. 解析 $ARGUMENTS 识别意图
2. 匹配内置工作流（见"可用工作流"表）
3. 按工作流定义的顺序调度 Agent
4. 每步传递上下文给下一步
5. 汇总结果，输出报告
```

### 直接调度
```
1. 解析 $ARGUMENTS 识别意图
2. 无工作流匹配，选择最相关 Agent
3. 调度 Agent 执行
4. 输出结果
```

## 上下文传递格式

```typescript
interface WorkflowContext {
  workflow: string;
  currentStep: number;
  input: {
    requirement: string;
    userContext?: Record<string, any>;
  };
  stepResults: Array<{
    agent: string;
    status: "success" | "failed" | "partial";
    output: {
      findings: string[];
      recommendations: string[];
      artifacts?: string[];
    };
    context: Record<string, any>;
  }>;
}
```

## 输出格式

### 工作流执行报告
```markdown
## 🍑 Taozi 调度报告

### 识别的意图
- 任务类型: [开发/修复/优化/...]
- 复杂度: [简单/中等/复杂]

### 匹配的工作流
`feature-development` - 新功能端到端开发

### 执行步骤
1. ✅ fullstack-developer - 需求分析和代码实现
2. ✅ testing-engineer - 测试覆盖

### 核心结论
- 结论 1
- 结论 2

### 生成的产物
- `src/components/Login.tsx`
- `src/api/auth.ts`
- `tests/auth.test.ts`

### 后续建议
1. [建议 1]
2. [建议 2]
```

### 直接调度报告
```markdown
## 🍑 Taozi 调度报告

### 调用的 Agent
- fullstack-developer: 端到端开发任务

### 执行结果
[Agent 输出内容]

### 后续建议
[如有]
```

## 使用示例

```bash
# 工作流触发
/taozi 实现用户登录功能          # → feature-development
/taozi 修复支付流程的报错        # → bug-fixing
/taozi 审查最近的代码变更        # → code-review
/taozi 优化首页加载性能          # → performance-tuning
/taozi 重构用户模块代码          # → refactoring
/taozi 写项目 README            # → documentation

# 直接调度
/taozi 配置 Docker 部署         # → devops-engineer
/taozi 优化这个提示词            # → prompt-engineer
/taozi 写个简单的工具函数        # → fullstack-developer
```

## 🔗 工作流链

复杂任务遵循完整工作流链：

```
brainstorming → writing-plans → executing → code-review → verification
   探索意图       制定计划        执行实现      质量审查      验证完成
```

### 阶段说明

| 阶段 | 目的 | 输出 |
|------|------|------|
| brainstorming | 探索需求、理解意图 | 明确的需求列表 |
| writing-plans | 制定实现方案 | 可执行的计划 |
| executing | 并行调度 Agent 执行 | 代码/文档产物 |
| code-review | 审查质量和安全 | 审查报告 |
| verification | 验证完成度 | 通过/失败状态 |

### 何时使用完整链

- 新功能开发 → 完整链
- Bug 修复 → 跳过 brainstorming
- 文档任务 → 跳过 code-review
- 简单修改 → 仅 executing

## 相关领域 Skills

Claude 会根据任务自动引用相关的领域知识：

| Skill | 触发场景 |
|-------|---------|
| `frontend-react` | React 开发、组件设计、状态管理 |
| `backend-architecture` | 后端开发、API 设计、系统架构 |
| `nextjs-advanced` | Next.js、SSR/SSG、Server Actions |
| `typescript-types` | 复杂类型定义、泛型设计 |
| `legacy-migration` | 代码现代化、技术栈升级 |
| `sql-optimization` | 数据库优化、慢查询分析 |
