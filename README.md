# Taozi Plugin 4.3.0

智能开发工具集 - 工作流驱动、3 条铁律、思维工具箱、自动化 Hooks + YouMind AI 创作能力。

仓库地址：

- GitHub: `https://github.com/kedoupi/taozi-plugin`

## 概览

Taozi 支持两种运行时：

- Claude Code：通过插件、Skills、Hooks 使用
- Codex：通过仓库级运行时文件接入，读取 `AGENTS.md`、`.codex/agents/`、`.agents/skills/` 等本地配置

## 安装前提

- Node.js `>= 18`
- 如果让 AI 帮你安装，建议明确提供 GitHub 仓库地址，让 AI 先读取仓库说明再执行安装

### YouMind API Key（使用 AI 创作功能必须）

`/taozi:image`、`/taozi:research`、`/taozi:content`、`/taozi:clip`、`/taozi:ppt`、`/taozi:webpage`、`/taozi:wechat`、`/taozi:xiaohongshu` 这 8 个 skill 需要配置 YouMind API Key。

**获取 Key：** 访问 [youmind.com](https://youmind.com) → 设置 → API Key → 生成

**配置方式：**

```bash
# 永久配置（推荐）
echo 'export YOUMIND_API_KEY=sk-ym-xxxxxx' >> ~/.zshrc
source ~/.zshrc

# 如果用 bash
echo 'export YOUMIND_API_KEY=sk-ym-xxxxxx' >> ~/.bashrc
source ~/.bashrc
```

未配置时尝试使用上述命令，会自动提示设置方法。

## 安装

### Claude Code

#### 手动安装

在 Claude Code 中执行：

```
/plugin marketplace add kedoupi/taozi-plugin
/plugin install taozi@kedoupi
```

更新：

```
/plugin update taozi@kedoupi
```

#### 让 AI 帮你安装

推荐提示词：

```text
请帮我从 GitHub 安装 Taozi 到 Claude Code。
仓库地址是：https://github.com/kedoupi/taozi-plugin
请先读取这个仓库里的安装说明，确认 Claude Code 的安装方式。
如果还没添加 marketplace，就先添加；
然后执行正确的安装命令安装 taozi@kedoupi。
安装完成后告诉我结果。
```

更新提示词：

```text
请帮我更新 Claude Code 里的 Taozi。
仓库地址是：https://github.com/kedoupi/taozi-plugin
请先读取这个仓库里的安装说明，确认插件标识和 marketplace。
然后执行正确的更新命令，并告诉我是否成功。
```

### Codex

Codex 当前采用仓库级本地接入，不是像 Claude Code 那样的官方远端 plugin marketplace 安装。

#### 稳定安装

推荐使用稳定安装脚本：

```bash
npm run install:codex
```

它会先生成 Codex 产物，然后把 Taozi 安装到固定目录：

- `~/.codex/plugins/taozi/skills/`
- `~/.codex/plugins/taozi/agents/`

并将全局 Codex 入口链接到这个固定副本：

- `~/.codex/skills/*`
- `~/.codex/agents/*`

这样切换当前仓库分支时，不会把已安装的 Taozi 弄坏。

更新 Taozi 后，重新运行一次：

```bash
npm run install:codex
```

#### 让 AI 帮你安装

推荐提示词：

```text
请帮我从 GitHub 安装 Taozi 到 Codex。
仓库地址是：https://github.com/kedoupi/taozi-plugin
请先读取这个仓库里的安装说明，然后自己 clone 或更新这个仓库。
接着在仓库里执行 npm run install:codex。
安装完成后，告诉我安装目录、链接了多少 skills 和 agents，以及是否需要我重开 Codex 会话。
```

这个提示词对应的是“AI 读取 GitHub 仓库并执行安装脚本”的方式，不是 Codex 官方远端 plugin marketplace。

#### 仓库内开发模式

如果你只是想在当前仓库里直接开发和调试 Codex 产物，也可以只同步仓库内运行时文件：

```bash
node scripts/sync-codex.js
```

然后让 Codex 在本仓库中读取：

- `AGENTS.md`
- `.codex/config.toml`
- `.codex/agents/`
- `.agents/skills/`

仓库里仍然保留了一个本地 marketplace 约定，供 repo-local 场景使用：

```bash
mkdir -p .agents/plugins
```

本仓库已包含 `.agents/plugins/marketplace.json`。

注意：

- `.agents/plugins/marketplace.json` 当前声明的是本地 source（`"./"`），用于 repo-local 加载
- 将仓库推送到 GitHub 本身，不会自动变成 Codex 官方远端插件安装入口

## 运行时映射

- 所有 slash 触发（`/taozi:xxx`）统一走 `skills/*/SKILL.md`，不再维护 `commands/` 目录（官方已合并）
- Codex 复用共享 skills + 生成的 subagents
- `agents/` 与 `skills/` 是单一事实来源
- 修改后运行 `node scripts/sync-codex.js` 同步 Codex 产物

## Skills（30+ 个）

所有 skills 触发形式统一为 `/taozi:<skill-name>`。

### 开发工作流

| 触发 | 功能 |
|------|------|
| `/taozi:taozi` | 智能调度入口 - 意图识别 + 工作流匹配 |
| `/taozi:git-workflow` | Git 工作流（commit / pr / worktree / cleanup 合流） |
| `/taozi:update-context` | 更新目录 CLAUDE.md |
| `/taozi:ultra-think` | 深度分析思考 |
| `/taozi:plan` | 创建功能实现计划 |
| `/taozi:tdd` | TDD 工作流 — RED→GREEN→REFACTOR |
| `/taozi:learning` | 从会话提取可复用模式 |
| `/taozi:checkpoint` | 保存工作状态检查点 |
| `/taozi:verify` | 运行构建/测试/lint/安全验证 |
| `/taozi:build-fix` | 修复构建错误 |
| `/taozi:code-review` | 代码审查 |
| `/taozi:harness-audit` | 审计插件配置 |
| `/taozi:evolve` | 将学习模式聚类为 Skill |
| `/taozi:instinct-status` | 查看已学习模式 |
| `/taozi:instinct-import` | 导入学习模式 |
| `/taozi:instinct-export` | 导出学习模式 |
| `/taozi:multi-plan` | 多 Agent 协作规划 |
| `/taozi:multi-execute` | 多 Agent 并行执行 |
| `/taozi:security-scan` | 独立安全扫描（OWASP/密钥/依赖漏洞） |
| `/taozi:model-route` | 根据任务推荐最优模型 |
| `/taozi:quality-gate` | 发布前质量门禁（构建/测试/lint/安全） |
| `/taozi:skill-create` | 手动创建可复用 Skill |

### YouMind AI 创作

> 需要配置 `YOUMIND_API_KEY`，详见[安装前提 → YouMind API Key](#youmind-api-key使用-ai-创作功能必须)。

| 触发 | 功能 |
|------|------|
| `/taozi:image` | AI 图片生成（Gemini 多模型，支持批量 + 风格锚点）|
| `/taozi:research` | 热点研究（webSearch + 深度 research，输出结构化报告）|
| `/taozi:content` | 多平台内容创作（小红书 / 公众号 / 抖音 / X）|
| `/taozi:clip` | 内容采集与分析（YouTube / 微信公众号 / 网页，AI 深度分析）|
| `/taozi:ppt` | PPT 生成（返回封面图预览 + Craft 编辑链接）|
| `/taozi:webpage` | 网页生成（描述 → 可访问的 CDN 链接）|
| `/taozi:wechat` | 微信公众号全链路（热点选题 → 研究 → 写作 → 封面图 → 草稿箱）|
| `/taozi:xiaohongshu` | 小红书全链路（热点选题 → 研究 → 正文 → 话题标签 → AI 多图配套）|

## 使用示例

### 开发工作流

```text
# 工作流触发 - 自动编排（智能路由）
/taozi:taozi 实现用户登录功能          # → feature-development 工作流
/taozi:taozi 修复支付流程的报错        # → bug-fixing 工作流
/taozi:taozi 审查最近的代码变更        # → code-review 工作流

# Git 工作流（commit / pr / worktree / cleanup 已合流到 git-workflow skill）
/taozi:git-workflow worktree feat/login   # 隔离环境
/taozi:git-workflow commit                # 智能提交
/taozi:git-workflow pr                    # 创建 PR
/taozi:git-workflow cleanup               # PR 合并后清理
```

### AI 创作工作流

```text
# 研究 → 内容 → 配图（分步）
/taozi:research 分析小红书宠物赛道最新趋势
/taozi:content 基于上面的研究，帮我写一篇种草文
/taozi:image 生成适合小红书风格的宠物封面图

# 平台专项创作
/taozi:wechat 帮我做一个关于 AI 工具的公众号文章，要有数据支撑
/taozi:xiaohongshu 分享一个 AI 工具测评，走信息密集风格

# 采集 URL 并分析
/taozi:clip https://www.youtube.com/watch?v=xxx 分析视频核心观点

# 一键生成 PPT / 网页
/taozi:ppt 2025 年 AI 行业趋势报告
/taozi:webpage 设计一个产品发布落地页
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

## Skills（61 个）

Claude / Codex 根据任务自动引用相关知识库；同时 `/taozi:<name>` 手动触发工作流类 skill。

### 工作流 Skills（22 个，带 `/taozi:` 触发）

`taozi` · `plan` · `tdd` · `verify` · `code-review` · `quality-gate` · `git-workflow` · `update-context` · `model-route` · `learning` · `multi-plan` · `multi-execute` · `build-fix` · `checkpoint` · `ultra-think` · `evolve` · `harness-audit` · `instinct-status` · `instinct-import` · `instinct-export` · `skill-create` · `security-scan`

### 开发知识库（31 个，自动引用）

`frontend-react` · `backend-architecture` · `nextjs-advanced` · `nextjs-architecture` · `typescript-types` · `typescript-patterns` · `python-patterns` · `go-patterns` · `swift-patterns` · `swift-concurrency` · `foundation-models` · `django-patterns` · `springboot-patterns` · `springboot-tdd` · `springboot-security` · `docker-patterns` · `e2e-testing` · `api-design` · `deployment-patterns` · `database-migrations` · `security-patterns` · `sql-optimization` · `legacy-migration` · `testing-strategies` · `mcp-templates` · `git-conventions` · `code-quality-checklist` · `thinking-tools` · `continuous-learning` · `token-optimization` · `deep-research`

### YouMind 创作 Skills（8 个）

`image` · `research` · `content` · `clip` · `ppt` · `webpage` · `wechat` · `xiaohongshu`

## YouMind AI 创作能力（详细说明）

> 触发列表见 [Skills → YouMind AI 创作](#youmind-ai-创作)，用法示例见 [使用示例 → AI 创作工作流](#ai-创作工作流)。

### 创作链路

```
/taozi:research → 研究报告（热点 + 数据 + 选题建议）
       ↓
/taozi:content  → 多平台内容（小红书 / 公众号 / 抖音 / X）
       ↓
/taozi:image    → 配图生成
```

或按平台触发：`/taozi:wechat`（公众号）、`/taozi:xiaohongshu`（小红书）。

### `/taozi:clip` 支持的内容来源

| 来源类型 | 支持 | 说明 |
|------|------|------|
| YouTube 视频 | ✅ | 自动提取字幕 / 转录内容 |
| 微信公众号文章 | ✅ | |
| 普通公开网页 | ✅ | 部分站点 |
| 知乎 / 小红书 | ❌ | 需要登录，无法抓取 |

### `/taozi:ppt` 输出

返回两个产物：
- **封面图**：幻灯片第一页预览图 URL
- **Craft 链接**：可在 YouMind Craft 编辑器中继续修改完整 PPT

### `/taozi:webpage` 输出

返回一个直接可访问的 CDN 链接，无需部署，生成即可分享。

## Rules（31 个规则文件）

Claude 自动遵循的约束规范，覆盖通用编码规范 + TypeScript / Python / Go / Swift / Java 5 个语言生态。

## Hooks（11 个自动化钩子）

| 事件 | 描述 |
|------|------|
| PreToolUse | 检测 `YOUMIND_API_KEY`，未配置时 block YouMind 命令并给出设置指引 |
| PreToolUse | 阻止 `git --no-verify`（铁律 1） |
| PreToolUse | dev server 建议使用 tmux |
| PostToolUse | 编辑后检测 `console.log` |
| PostToolUse | 阻止随意创建 `.md` 文件 |
| PostToolUse | 每编辑 15 个文件建议压缩上下文 |
| SessionStart | 加载上次会话上下文 |
| Stop | 保存会话状态 |
| Stop | 会话结束后评估可学习模式 |
| Stop | 会话结束后扫描安全问题（OWASP Top 10）|
| PreCompact | 压缩前保留关键上下文 |

## MCP 配置

`mcp-configs/` 提供开箱即用的 MCP Server 配置：GitHub · Supabase · Vercel

## 开发

```bash
node scripts/sync-codex.js
node tests/run-all.js
```

## License

MIT
