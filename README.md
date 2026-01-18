# Taozi Plugin 2.1

智能开发工具集 - 工作流驱动、3 条铁律、思维工具箱。

支持 **Claude Code** / **OpenCode** / **Codex** 多平台。

## 2.1 新特性

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
curl -fsSL https://raw.githubusercontent.com/kedoupi/taozi-plugin/main/install.sh | bash
```

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

## Agents (10 个核心)

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

### 工具链
| Skill | 描述 |
|-------|------|
| `typescript-patterns` | TypeScript 模式参考 |
| `nextjs-architecture` | Next.js 架构模式 |
| `testing-strategies` | 测试策略参考 |
| `mcp-templates` | MCP 开发模板 |
| `git-conventions` | Git 提交规范 |
| `code-quality-checklist` | 代码质量清单 |

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
┌─────────────────────────────────────────┐
│     Commands 层（用户入口 + 编排）       │
│  /taozi → 意图识别 → 工作流匹配 → 调度   │
├─────────────────────────────────────────┤
│     Workflows 层（工作流程定义）         │
│  feature-dev | bug-fix | review | ...   │
├─────────────────────────────────────────┤
│     Agents 层（10 个核心执行者）         │
│  fullstack | debugger | reviewer | ...  │
├─────────────────────────────────────────┤
│     Skills 层（专业知识库）              │
│  typescript | nextjs | sql | legacy ... │
└─────────────────────────────────────────┘
```

## 更新

```bash
/plugin update taozi@kedoupi
```

## 文档

- [开发者指南](DEVELOPER.md) - 插件开发说明
- [MCP 接口设计](docs/MCP-INTERFACE.md) - MCP 化准备

## License

MIT
