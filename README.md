# Taozi Plugin 3.2

智能开发工具集 - 工作流驱动、3 条铁律、思维工具箱、自动化 Hooks。

## 安装

在 Claude Code 中运行：

```
/plugin marketplace add kedoupi/taozi-plugin
/plugin install taozi@kedoupi
```

更新：

```
/plugin update taozi@kedoupi
```

## Commands（25 个）

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
| `/security-scan` | 独立安全扫描（OWASP/密钥/依赖漏洞） |
| `/model-route` | 根据任务推荐最优模型 |
| `/quality-gate` | 发布前质量门禁（构建/测试/lint/安全） |
| `/skill-create` | 手动创建可复用 Skill |

## 使用示例

```
# 工作流触发 - 自动编排
/taozi 实现用户登录功能          # → feature-development 工作流
/taozi 修复支付流程的报错        # → bug-fixing 工作流
/taozi 审查最近的代码变更        # → code-review 工作流

# Git 工作流
/worktree feat/login    # 创建隔离开发环境
/commit                  # 智能提交
/pr                      # 创建 PR
/cleanup                 # 清理
```

## Agents（23 个）

### 编排层
| Agent | 专长 |
|-------|------|
| chief-of-staff | 高层任务编排、Agent 调度、结果汇总 |

### 执行层
| Agent | 专长 |
|-------|------|
| fullstack-developer | 端到端开发、完整功能实现 |
| devops-engineer | CI/CD、Docker、K8s、部署 |
| debugger | Bug 诊断、错误分析 |
| build-error-resolver | 构建错误修复、类型错误 |

### 规划层
| Agent | 专长 |
|-------|------|
| architect | 系统架构、技术选型 |
| planner | 需求分解、任务拆分 |

### 质量层
| Agent | 专长 |
|-------|------|
| code-reviewer | 代码质量、安全性审查（通用） |
| typescript-reviewer | TypeScript 类型安全、React hooks |
| python-reviewer | Python 类型注解、async 陷阱 |
| go-reviewer | goroutine 泄漏、error 处理 |
| java-reviewer | Spring 反模式、JPA N+1 |
| testing-engineer | 测试策略、TDD、覆盖率 |
| tdd-guide | TDD 循环强制、RED→GREEN→REFACTOR |
| e2e-runner | Playwright E2E 测试 |
| security-reviewer | 安全漏洞检测、OWASP Top 10 |

### 优化层
| Agent | 专长 |
|-------|------|
| refactoring-specialist | 代码重构、设计模式 |
| performance-engineer | 性能分析、优化调优 |
| refactor-cleaner | 死代码清理 |

### 支撑层
| Agent | 专长 |
|-------|------|
| documentation-engineer | 技术文档、API 文档 |
| doc-updater | 文档同步、codemap 更新 |
| context-manager | 上下文优化、CLAUDE.md |
| prompt-engineer | LLM 提示优化、AI 系统 |

## Skills（31 个）

Claude 根据任务自动引用相关知识库：

`frontend-react` · `backend-architecture` · `nextjs-advanced` · `nextjs-architecture` · `typescript-types` · `typescript-patterns` · `python-patterns` · `go-patterns` · `swift-patterns` · `swift-concurrency` · `foundation-models` · `django-patterns` · `springboot-patterns` · `springboot-tdd` · `springboot-security` · `docker-patterns` · `e2e-testing` · `api-design` · `deployment-patterns` · `database-migrations` · `security-patterns` · `sql-optimization` · `legacy-migration` · `testing-strategies` · `mcp-templates` · `git-conventions` · `code-quality-checklist` · `thinking-tools` · `continuous-learning` · `token-optimization` · `deep-research`

## Rules（31 个规则文件）

Claude 自动遵循的约束规范，覆盖通用编码规范 + TypeScript / Python / Go / Swift / Java 5 个语言生态。

## Hooks（8 个自动化钩子）

| 事件 | 描述 |
|------|------|
| PreToolUse | 阻止 `git --no-verify`（铁律 1） |
| PreToolUse | dev server 建议使用 tmux |
| PostToolUse | 编辑后检测 `console.log` |
| PostToolUse | 阻止随意创建 `.md` 文件 |
| SessionStart | 加载上次会话上下文 |
| Stop | 保存会话状态 |
| PreCompact | 压缩前保留关键上下文 |

## MCP 配置

`mcp-configs/` 提供开箱即用的 MCP Server 配置：GitHub · Supabase · Vercel

## License

MIT
