# Taozi Plugin 3.1

智能开发工具集 - 工作流驱动、3 条铁律、思维工具箱、自动化 Hooks。

支持 **Claude Code** / **OpenCode** / **Codex** 多平台。

## 3.1 新特性

- **8 个新 Agent**: architect, planner, tdd-guide, e2e-runner, doc-updater, refactor-cleaner, build-error-resolver, security-reviewer（共 18 个）
- **7 个新 Skill**: django-patterns, springboot-patterns, docker-patterns, e2e-testing, api-design, deployment-patterns, database-migrations（共 26 个）
- **14 个新 Command**: /plan, /tdd, /learn, /checkpoint, /verify, /build-fix, /code-review, /harness-audit, /evolve, /instinct-status, /instinct-import, /instinct-export, /multi-plan, /multi-execute（共 21 个）
- **Rules 语言分层**: typescript/python/golang/swift 每个语言 5 个规则文件（共 26 个 rules）
- **安全扫描增强**: OWASP Top 10 全面覆盖，14 种密钥检测模式
- **Instinct 进化**: 自动从会话学习 → 聚类 → 进化为可复用 Skill
- **多 Agent 编排**: 复杂任务自动分解 → 并行分配 → 结果聚合
- **npm 包**: `taozi-universal` 支持标准化分发
- **338 个测试**: 全部通过

## 3.0 新特性

- **Hooks 系统**: 7 个自动化 Hook，跨 5 个事件拦截和增强工具调用
- **Rules 系统**: 6 个通用规则文件 + 4 语言分层规则
- **3 铁律强制**: Hooks 自动执行铁律约束（如阻止 `--no-verify`）
- **安装 Profiles**: `--profile minimal|standard|full` 选择安装范围

## 2.1 特性

- **3 条铁律**: 调试铁律 (NO FIXES WITHOUT ROOT CAUSE)、TDD 铁律 (RED→GREEN→REFACTOR)、验证铁律 (EVIDENCE BEFORE ASSERTIONS)
- **思维工具箱**: 反转练习、简化级联、规模测试、概念碰撞
- **工作流链**: brainstorming → plans → executing → review → verification

## 2.0 特性

- **工作流驱动**: 6 个内置工作流，自动编排多 Agent 协作
- **Agent 精简**: 从 19 个精简到 10 个核心 Agent，职责更清晰
- **Skills 知识库**: 12+ 个 Skills，Claude 根据任务自动引用
- **MCP 就绪**: 标准化接口，为 MCP 化做准备

## 一键安装

```bash
# 默认安装（standard profile）
curl -fsSL https://raw.githubusercontent.com/kedoupi/taozi-plugin/main/install.sh | bash

# 指定 profile
curl -fsSL https://raw.githubusercontent.com/kedoupi/taozi-plugin/main/install.sh | bash -s -- --profile full
```

**安装 Profiles**：

| Profile | 包含内容 | 适合 |
|---------|---------|------|
| `minimal` | Commands + Agents | 轻量使用 |
| `standard` | + Skills + Rules + Hooks | 日常开发（默认） |
| `full` | + 测试工具 + 调试脚本 | 插件开发者 |

## 平台安装

### Claude Code

```bash
# 添加插件源
/plugin marketplace add kedoupi/taozi-plugin

# 安装插件
/plugin install taozi@kedoupi
```

### OpenCode

详见 [OpenCode 安装指南](.opencode/INSTALL.md)

### Codex

详见 [Codex 安装指南](.codex/INSTALL.md)

## Commands

| 命令 | 功能 |
|------|------|
| `/taozi` | 智能调度入口 - 意图识别 + 工作流匹配 |
| `/commit` | emoji + 约定式 Git 提交 |
| `/pr` | 推送分支并创建 GitHub PR |
| `/worktree` | 创建 Git worktree 隔离开发 |
| `/cleanup` | PR 合并后清理 worktree 和分支 |
| `/update-context` | 更新目录 CLAUDE.md |
| `/ultra-think` | 深度分析思考 |
| `/plan` | 创建功能实现计划 |
| `/tdd` | TDD 工作流 — RED→GREEN→REFACTOR |
| `/learn` | 从会话提取可复用模式 |
| `/checkpoint` | 保存工作状态检查点 |
| `/verify` | 运行构建/测试/lint/安全验证 |
| `/build-fix` | 修复构建错误 |
| `/code-review` | 代码审查 |
| `/harness-audit` | 审计插件配置 |
| `/evolve` | 将学习模式聚类为 Skill |
| `/instinct-status` | 查看已学习模式 |
| `/instinct-import` | 导入学习模式 |
| `/instinct-export` | 导出学习模式 |
| `/multi-plan` | 多 Agent 协作规划 |
| `/multi-execute` | 多 Agent 并行执行 |

## 工作流 (Workflows)

自动编排多 Agent 协作，覆盖常见开发场景：

| 工作流 | 触发关键词 | 执行 Agent |
|--------|-----------|-----------|
| feature-development | 功能, 实现, 开发, 新增 | fullstack → testing |
| bug-fixing | Bug, 错误, 报错, 修复 | debugger → testing |
| code-review | 审查, review, 检查代码 | code-reviewer |
| performance-tuning | 性能, 优化, 慢, 加载 | performance → fullstack |
| refactoring | 重构, 改进, 清理 | refactoring → testing |
| documentation | 文档, README, 注释 | documentation |

## Agents (18 个)

### 执行层
| Agent | 专长 | 模型 |
|-------|------|------|
| fullstack-developer | 端到端开发、完整功能实现 | Opus |
| devops-engineer | CI/CD、Docker、K8s、部署 | Sonnet |
| debugger | Bug 诊断、错误分析、问题排查 | Opus |
| build-error-resolver | 构建错误修复、类型错误、依赖冲突 | Sonnet |

### 规划层
| Agent | 专长 | 模型 |
|-------|------|------|
| architect | 系统架构、技术选型、可扩展性分析 | Opus |
| planner | 需求分解、任务拆分、依赖分析 | Sonnet |

### 质量层
| Agent | 专长 | 模型 |
|-------|------|------|
| code-reviewer | 代码质量、安全性审查 | Sonnet |
| testing-engineer | 测试策略、TDD、覆盖率 | Sonnet |
| tdd-guide | TDD 循环强制、RED→GREEN→REFACTOR | Sonnet |
| e2e-runner | Playwright E2E 测试、Page Object Model | Sonnet |
| security-reviewer | 安全漏洞检测、OWASP Top 10 | Sonnet |

### 优化层
| Agent | 专长 | 模型 |
|-------|------|------|
| refactoring-specialist | 代码重构、设计模式 | Sonnet |
| performance-engineer | 性能分析、优化调优 | Sonnet |
| refactor-cleaner | 死代码清理、重复代码合并 | Sonnet |

### 支撑层
| Agent | 专长 | 模型 |
|-------|------|------|
| documentation-engineer | 技术文档、API 文档 | Sonnet |
| doc-updater | 文档同步、codemap 更新 | Sonnet |
| context-manager | 上下文优化、CLAUDE.md | Sonnet |
| prompt-engineer | LLM 提示优化、AI 系统 | Opus |

## Skills

Claude 根据任务自动引用相关知识库（`skills/*/SKILL.md`）：

### 思维工具
| Skill | 描述 |
|-------|------|
| `thinking-tools` | 反转练习、简化级联、规模测试、概念碰撞 |

### 领域知识
| Skill | 描述 |
|-------|------|
| `frontend-react` | React 开发、组件设计、状态管理 |
| `backend-architecture` | 后端架构、API 设计、认证授权 |
| `nextjs-advanced` | Next.js App Router、Server Components |
| `typescript-types` | 高级类型、泛型、类型体操 |
| `legacy-migration` | 代码现代化、技术栈升级 |
| `sql-optimization` | 索引策略、查询优化、分页 |
| `django-patterns` | Django Models/Views/DRF/Celery |
| `springboot-patterns` | Spring Boot 分层/Security/JPA |
| `docker-patterns` | 多阶段构建/Compose/安全 |
| `e2e-testing` | Playwright/Page Object Model |
| `api-design` | REST 设计/分页/错误处理 |
| `deployment-patterns` | CI/CD/蓝绿/金丝雀发布 |
| `database-migrations` | 零停机迁移/Prisma/Drizzle |
| `security-patterns` | OWASP Top 10 中文版 |
| `swift-patterns` | SwiftUI/actor 并发/SwiftData |
| `go-patterns` | goroutine/channel/interface/泛型 |
| `python-patterns` | type hints/FastAPI/async/pytest |

### 工具与优化
| Skill | 描述 |
|-------|------|
| `thinking-tools` | 反转练习、简化级联、规模测试、概念碰撞 |
| `typescript-patterns` | TypeScript 模式参考 |
| `nextjs-architecture` | Next.js 架构模式 |
| `testing-strategies` | 测试策略参考 |
| `mcp-templates` | MCP 开发模板 |
| `git-conventions` | Git 提交规范 |
| `code-quality-checklist` | 代码质量清单 |
| `continuous-learning` | 从会话自动提取可复用模式 |
| `token-optimization` | Token 预算管理、模型选择、压缩策略 |

## Hooks（8 个自动化钩子）

Hooks 在特定事件触发时自动执行，拦截危险操作、提供智能建议：

| 事件 | Hook ID | 描述 |
|------|---------|------|
| PreToolUse | `pre:bash:no-verify` | 阻止 `git --no-verify`（铁律 1 强制执行） |
| PreToolUse | `pre:bash:tmux-hint` | dev server 建议使用 tmux |
| PostToolUse | `post:edit:console-warn` | 编辑后检测 `console.log` |
| PostToolUse | `post:write:block-random-md` | 阻止随意创建 `.md` 文件 |
| SessionStart | `session:start` | 加载上次会话上下文 |
| Stop | `stop:session-end` | 保存会话状态 |
| PreCompact | `pre:compact` | 压缩前保留关键上下文 |

## Rules（6 个规则文件）

Claude 在对话中自动遵循的约束规范：

| 文件 | 描述 |
|------|------|
| `iron-rules.md` | 3 条铁律：调试、TDD、验证 |
| `coding-style.md` | 编码风格：不可变性、命名、函数式 |
| `git-workflow.md` | Git 规范：Conventional Commits |
| `testing.md` | 测试规范：覆盖率要求、TDD 流程 |
| `security.md` | 安全规范：输入验证、密钥管理 |
| `performance.md` | 性能规范：模型选择、优化原则 |

## 使用示例

```bash
# 工作流触发 - 自动编排
/taozi 实现用户登录功能          # → feature-development 工作流
/taozi 修复支付流程的报错        # → bug-fixing 工作流
/taozi 审查最近的代码变更        # → code-review 工作流
/taozi 优化首页加载性能          # → performance-tuning 工作流

# 直接调度 - 单 Agent
/taozi 配置 Docker 部署         # → devops-engineer
/taozi 优化这个提示词            # → prompt-engineer

# Git 工作流
/worktree feat/login    # 创建隔离开发环境
/commit                  # 智能提交
/pr                      # 创建 PR
/cleanup                 # 清理
```

## 架构

```
┌─────────────────────────────────────────────┐
│     Commands 层（用户入口 + 编排）           │
│  /taozi → 意图识别 → 工作流匹配 → 调度       │
├─────────────────────────────────────────────┤
│     Hooks 层（自动化拦截 + 增强）            │
│  PreToolUse | PostToolUse | Session | ...   │
├─────────────────────────────────────────────┤
│     Rules 层（约束规范，自动遵循）            │
│  iron-rules | coding-style | security | ... │
├─────────────────────────────────────────────┤
│     Workflows 层（工作流程定义）             │
│  feature-dev | bug-fix | review | ...       │
├─────────────────────────────────────────────┤
│     Agents 层（10 个核心执行者）             │
│  fullstack | debugger | reviewer | ...      │
├─────────────────────────────────────────────┤
│     Skills 层（专业知识库）                  │
│  typescript | nextjs | sql | legacy ...     │
├─────────────────────────────────────────────┤
│     Scripts 层（工具库 + Hook 脚本）         │
│  utils.js | no-verify-guard | session | ... │
├─────────────────────────────────────────────┤
│     Tests 层（227 个零依赖测试）             │
│  agents | skills | hooks | rules | utils    │
└─────────────────────────────────────────────┘
```

## 测试

```bash
node tests/run-all.js
```

## 更新

```bash
/plugin update taozi@kedoupi
```

## 文档

- [开发者指南](DEVELOPER.md) - 插件架构、Hooks/Rules/Tests 详解
- [贡献指南](CONTRIBUTING.md) - 如何添加 Agent/Skill/Hook/Rule
- [MCP 接口设计](docs/MCP-INTERFACE.md) - MCP 化准备

## License

MIT
