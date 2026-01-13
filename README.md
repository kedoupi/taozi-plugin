# Taozi Plugin

Taozi 开发工具集 - 智能调度、19 个专家 Agent、Git 工作流。

## 安装

### 方式 1：命令行安装（推荐）

```bash
# 1. 添加插件源（一次性）
/plugin marketplace add kedoupi/taozi-plugin

# 2. 安装插件
/plugin install taozi@kedoupi
```

### 方式 2：交互式 UI 安装

```bash
/plugin
```
1. 点击 **Marketplaces** 标签，添加源：`kedoupi/taozi-plugin`
2. 点击 **Discover** 标签，找到 taozi 并安装

### 方式 3：手动安装

```bash
cd ~/.claude/plugins
git clone git@github.com:kedoupi/taozi-plugin.git taozi
# 然后在 Claude Code 中运行 /plugin 启用插件
```

## 更新

```bash
/plugin update taozi@kedoupi
```

## 卸载

```bash
/plugin uninstall taozi@kedoupi
```

## Commands

| 命令 | 功能 |
|------|------|
| `/taozi` | 智能调度入口 - 自动分析任务并调用合适的 agent |
| `/commit` | emoji + 约定式 Git 提交 |
| `/pr` | 推送分支并创建 GitHub PR |
| `/worktree` | 创建 Git worktree 隔离开发 |
| `/cleanup` | PR 合并后清理 worktree 和分支 |
| `/update-context` | 更新目录 CLAUDE.md |
| `/ultra-think` | 深度分析思考 |

## Agents (19 个专家)

### 开发类
- **frontend-developer** - React、UI 组件、状态管理、前端性能
- **backend-architect** - API 设计、微服务、数据库、可扩展性
- **fullstack-developer** - 端到端开发、API 集成、完整功能实现
- **nextjs-architecture-expert** - Next.js、App Router、SSR、性能优化
- **typescript-pro** - 类型系统、泛型、类型安全架构

### 质量类
- **code-reviewer** - 代码质量、安全性、可维护性审查
- **testing-engineer** - 测试策略、TDD、单元/集成/E2E 测试
- **debugger** - Bug 诊断、错误分析、问题排查
- **security-auditor** - 安全漏洞、渗透测试、OWASP 合规

### 优化类
- **performance-engineer** - 性能分析、瓶颈诊断、优化调优
- **refactoring-specialist** - 代码重构、设计模式、技术债务清理
- **legacy-modernizer** - 遗留代码迁移、框架升级、现代化
- **sql-pro** - SQL 查询优化、数据库设计

### 工程类
- **devops-engineer** - CI/CD、Docker、K8s、云服务、自动化运维
- **mcp-developer** - MCP 协议、工具开发、Claude 集成
- **documentation-engineer** - 技术文档、API 文档、架构文档
- **prompt-engineer** - LLM 提示优化、AI 系统设计
- **context-manager** - 上下文优化、Token 管理

### 设计类
- **ui-ux-designer** - 用户体验、界面设计、可访问性

## Skills

- **taozi-workflow** - Git 工作流知识库（worktree、提交规范、PR 流程）

## 使用示例

```bash
# 智能调度 - 自动选择合适的 agent
/taozi 实现用户登录功能
/taozi 优化首页加载性能
/taozi 修复支付流程的报错

# Git 工作流
/worktree feat/login    # 创建隔离开发环境
/commit                  # 智能提交
/pr                      # 创建 PR
/cleanup                 # 清理
```

## License

MIT
