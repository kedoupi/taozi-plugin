# Taozi Plugin 6.1.0

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

`/taozi:image`、`/taozi:infographic`、`/taozi:research`、`/taozi:clip`、`/taozi:ppt`、`/taozi:webpage`、`/taozi:wechat`、`/taozi:xiaohongshu` 这 8 个 skill 需要配置 YouMind API Key。

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

## Skills（71 个）

所有 skills 触发形式统一为 `/taozi:<skill-name>`。

### 开发工作流

| 触发 | 功能 |
|------|------|
| `/taozi:taozi` | 智能调度入口 - 意图识别 + 工作流匹配 |
| `/taozi:commit` | 智能 git 提交（emoji + Conventional Commits） |
| `/taozi:worktree` | 创建隔离 git worktree |
| `/taozi:update-context` | 更新目录 CLAUDE.md |
| `/taozi:ultra-think` | 深度分析思考 |
| `/taozi:plan` | 功能实现计划（重量版 5 阶段：探索 → 澄清 → 方案 → 设计文档 → 实现计划） |
| `/taozi:tdd` | TDD 工作流 — RED→GREEN→REFACTOR |
| `/taozi:learning` | 从会话提取可复用模式 |
| `/taozi:checkpoint` | 保存工作状态检查点 |
| `/taozi:verify` | 运行构建/测试/lint/安全验证（完成门禁：FAIL 时禁止声称完成） |
| `/taozi:debug` | 系统调试（Iron Law：4 阶段根因分析，禁止无根因 fix） |
| `/taozi:finish` | 分支收尾一体化（测试 → 本地 `--no-ff` 合并 → 清理分支/worktree；不自动推送 main） |
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
| `/taozi:setup` | Taozi 配置向导（YouMind Key / 品牌人设 / 平台凭据，支持微信/飞书等多平台）|
| `/taozi:lark` | 飞书万能链接助手（任意飞书链接读取→分析→逐步确认→写回；项目目录绑定知识库）|

### YouMind AI 创作

> 需要配置 `YOUMIND_API_KEY`，详见[安装前提 → YouMind API Key](#youmind-api-key使用-ai-创作功能必须)。

| 触发 | 功能 |
|------|------|
| `/taozi:image` | AI 图片生成（Context Mode 内容感知，自动决策风格/角色/尺寸；Gemini 多模型，批量 + Style Anchor 系列一致性）|
| `/taozi:infographic` | 专业信息图生成（14 种布局 × 15 种风格，自动匹配内容结构，wechat/xiaohongshu 共用）|
| `/taozi:research` | 热点研究（webSearch + 深度 research，输出结构化报告）|
| `/taozi:clip` | 内容采集与分析（YouTube / 微信公众号 / 网页，AI 深度分析）|
| `/taozi:ppt` | PPT 生成（返回封面图预览 + Craft 编辑链接）|
| `/taozi:webpage` | 网页生成（描述 → 可访问的 CDN 链接）|
| `/taozi:wechat` | 微信公众号全链路（热点选题 → 研究 → 写作 → 章节配图 → 草稿箱；image Context Mode 自主决策风格，封面 900×383，角色锚点注入）|
| `/taozi:xiaohongshu` | 小红书全链路（热点选题 → 研究 → 正文 → 配图；baoyu-xhs-images 风格体系，12种风格×8种布局，封面/正文统一 3:4，图文卡含标题文字+角色+Style Anchor）|

## 使用示例

### 开发工作流

```text
# 工作流触发 - 自动编排（智能路由）
/taozi:taozi 实现用户登录功能          # → feature-development 工作流
/taozi:taozi 修复支付流程的报错        # → bug-fixing 工作流
/taozi:taozi 审查最近的代码变更        # → code-review 工作流

# Git 工作流（4 个 skill，围绕日常快撸 / 完整 Git Flow 两种模式）
/taozi:worktree feat/login   # 隔离环境（模式 A）
/taozi:commit                # 智能提交（日常主力）
/taozi:finish                # 本地收尾：测试 → --no-ff 合并 → 清理分支/worktree
# 想发 PR 请手动：git push -u origin <branch> && gh pr create
```

### AI 创作工作流

```text
# 平台专项创作（内置研究 + 正文 + 配图）
/taozi:wechat 帮我做一个关于 AI 工具的公众号文章，要有数据支撑
/taozi:xiaohongshu 分享一个 AI 工具测评，走信息密集风格

# 先调研再写（分步）
/taozi:research 分析小红书宠物赛道最新趋势
/taozi:xiaohongshu 基于上面的研究，帮我写一篇种草文

# 采集 URL 并分析
/taozi:clip https://www.youtube.com/watch?v=xxx 分析视频核心观点

# 一键生成 PPT / 网页
/taozi:ppt 2025 年 AI 行业趋势报告
/taozi:webpage 设计一个产品发布落地页
```

<!-- catalog:agents:start -->
## Agents（36 个）

### 编排层
| Agent | 专长 |
|-------|------|
| chief-of-staff | 高层任务编排者。分析复杂请求，拆解为子任务，选择最优 Agent 组合，协调执行顺序，汇总结果。比 /taozi 更智能的调度层。 |

### 执行层
| Agent | 专长 |
|-------|------|
| fullstack-developer | 端到端开发主力专家，覆盖前端、后端、数据库和完整功能实现。所有开发任务的首选 Agent。 |
| devops-engineer | DevOps 和基础设施专家。在 CI/CD 流水线、Docker 容器化、Kubernetes 部署、云服务配置、监控告警和自动化运维方面请主动使用。 |
| debugger | 专门处理错误、测试失败和意外行为的调试专家。遇到问题、分析堆栈跟踪或调查系统问题时请主动使用。 |
| build-error-resolver | TypeScript/Node.js 构建错误修复专家 — TS 类型错误、编译失败、依赖冲突快速定位和修复。其他语言请用对应的 {lang}-build-resolver。 |

### 规划层
| Agent | 专长 |
|-------|------|
| architect | 系统架构设计专家 — 技术选型、架构模式、数据流设计、可扩展性分析 |
| planner | 功能实现规划师 — 需求分解、任务拆分、依赖分析、风险评估 |

### 质量层
| Agent | 专长 |
|-------|------|
| code-reviewer | 代码质量与安全审查专家。负责代码审查、安全漏洞检测、质量评估和最佳实践验证。 |
| typescript-reviewer | TypeScript 专项代码审查。聚焦类型安全、any 滥用、泛型设计、React hooks 陷阱、运行时与编译期安全的一致性。 |
| python-reviewer | Python 专项代码审查。聚焦类型注解完整性、async/await 陷阱、可变默认参数、异常处理模式、依赖注入与测试可测性。 |
| go-reviewer | Go 专项代码审查。聚焦 goroutine 泄漏、channel 死锁、error 处理规范、interface 设计、context 传播。 |
| java-reviewer | Java/Spring 专项代码审查。聚焦 Spring 反模式、JPA N+1、事务边界、依赖注入滥用、空指针风险。 |
| cpp-reviewer | C++ 专项代码审查。聚焦内存安全（raw pointer/UAF）、未定义行为、RAII 违反、现代 C++ 惯用法。 |
| csharp-reviewer | C# 专项代码审查。聚焦 async/await 死锁、IDisposable 泄漏、LINQ 延迟求值陷阱、nullable 注解完整性。 |
| kotlin-reviewer | Kotlin 专项代码审查。聚焦协程泄漏、null safety 绕过、Java 互操作陷阱、Compose 性能问题。 |
| rust-reviewer | Rust 专项代码审查。聚焦 unsafe 合规性、所有权/借用反模式、async 阻塞、错误处理规范。 |
| flutter-reviewer | Flutter/Dart 专项代码审查。聚焦 Widget 重建性能、BuildContext 跨 async 使用、null safety 绕过、状态管理反模式。 |
| testing-engineer | 测试策略、用例设计和质量保证专家。在编写单元测试、集成测试、E2E 测试、TDD 实践、测试覆盖率优化和测试架构设计方面请主动使用。 |
| tdd-guide | TDD 引导专家 — 强制执行 RED→GREEN→REFACTOR 循环，确保测试先行 |
| e2e-runner | E2E 测试专家 — Playwright 测试生成、页面模型、CI 集成 |
| security-reviewer | 安全审查专家 — 漏洞检测、OWASP Top 10、密钥泄露、依赖安全 |

### 语言构建修复层
| Agent | 专长 |
|-------|------|
| cpp-build-resolver | C++ 构建错误修复专家 — 头文件找不到、链接错误、模板实例化失败、CMake 配置问题快速定位和修复 |
| csharp-build-resolver | C#/.NET 构建错误修复专家 — NuGet 依赖冲突、目标框架不兼容、EF migrations 不同步、缺少 using 快速定位和修复 |
| flutter-build-resolver | Flutter/Dart 构建错误修复专家 — pubspec 版本冲突、native plugin 编译失败、Dart SDK 版本不兼容、flutter pub 问题快速定位和修复 |
| go-build-resolver | Go 构建错误修复专家 — undefined、类型不匹配、module 路径错误、CGO 问题快速定位和修复 |
| java-build-resolver | Java/Spring 构建错误修复专家 — cannot find symbol、依赖冲突、Spring Bean 注入失败、Maven/Gradle 构建问题快速定位和修复 |
| kotlin-build-resolver | Kotlin 构建错误修复专家 — Gradle 构建失败、kapt 注解处理错误、Kotlin/JVM 版本不兼容、Compose 编译器问题快速定位和修复 |
| python-build-resolver | Python 构建错误修复专家 — ModuleNotFoundError、依赖冲突、mypy 类型错误、虚拟环境问题快速定位和修复 |
| rust-build-resolver | Rust 构建错误修复专家 — 生命周期标注、借用冲突、trait 未实现、feature flag 缺失快速定位和修复 |

### 优化层
| Agent | 专长 |
|-------|------|
| refactoring-specialist | 代码重构和架构改进专家。在代码异味识别、设计模式应用、技术债务清理、代码现代化和架构演进方面请主动使用。 |
| performance-engineer | 性能优化和调优专家。在应用性能分析、瓶颈诊断、前端性能优化、后端性能调优、数据库优化和负载测试方面请主动使用。 |
| refactor-cleaner | 代码清理专家 — 死代码检测、重复代码合并、依赖清理 |

### 支撑层
| Agent | 专长 |
|-------|------|
| documentation-engineer | 技术文档和 API 文档专家。在编写 README、API 文档、架构文档、用户指南和技术规范方面请主动使用。 |
| doc-updater | 文档更新专家 — 同步代码变更到文档、生成 codemap、维护 README |
| context-manager | 上下文优化和 Token 管理专家。在长对话管理、上下文压缩、信息提炼、会话策略优化和多轮对话效率提升方面请主动使用。 |
| prompt-engineer | 专门优化 LLM 和 AI 系统提示的专家。构建 AI 功能、改进代理性能或制作系统提示时请主动使用。精通提示模式和技巧。 |
<!-- catalog:agents:end -->

<!-- catalog:skills:start -->
## Skills（71 个）

Claude / Codex 根据任务自动引用相关知识库；同时 `/taozi:<name>` 手动触发工作流类 skill。

### 工作流 Skills（27 个，带 `/taozi:` 触发）

`taozi` · `plan` · `tdd` · `verify` · `debug` · `finish` · `code-review` · `quality-gate` · `commit` · `worktree` · `update-context` · `model-route` · `learning` · `multi-plan` · `multi-execute` · `build-fix` · `checkpoint` · `ultra-think` · `evolve` · `harness-audit` · `instinct-status` · `instinct-import` · `instinct-export` · `skill-create` · `security-scan` · `setup` · `lark`

### 开发知识库（36 个，自动引用）

`api-design` · `backend-architecture` · `code-quality-checklist` · `continuous-learning` · `cpp-patterns` · `csharp-patterns` · `database-migrations` · `deep-research` · `deployment-patterns` · `django-patterns` · `docker-patterns` · `e2e-testing` · `flutter-patterns` · `foundation-models` · `frontend-react` · `git-conventions` · `go-patterns` · `kotlin-patterns` · `legacy-migration` · `mcp-templates` · `nextjs-advanced` · `nextjs-architecture` · `python-patterns` · `rust-patterns` · `security-patterns` · `springboot-patterns` · `springboot-security` · `springboot-tdd` · `sql-optimization` · `swift-concurrency` · `swift-patterns` · `testing-strategies` · `thinking-tools` · `token-optimization` · `typescript-patterns` · `typescript-types`

### YouMind 创作 Skills（8 个）

`image` · `infographic` · `research` · `clip` · `ppt` · `webpage` · `wechat` · `xiaohongshu`
<!-- catalog:skills:end -->

## YouMind AI 创作能力（详细说明）

> 触发列表见 [Skills → YouMind AI 创作](#youmind-ai-创作)，用法示例见 [使用示例 → AI 创作工作流](#ai-创作工作流)。

### 创作链路

```
/taozi:wechat       → 公众号全链路（研究 + 写作 + 章节配图 + 草稿箱）
/taozi:xiaohongshu  → 小红书全链路（研究 + 正文 + 配图）
```

或手动分步：`/taozi:research` → `/taozi:wechat` 或 `/taozi:xiaohongshu` → `/taozi:image` 补充配图。

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

<!-- catalog:rules:start -->
## Rules（31 个规则文件）
<!-- catalog:rules:end -->

Claude 自动遵循的约束规范，覆盖通用编码规范 + TypeScript / Python / Go / Swift / Java 5 个语言生态。

<!-- catalog:hooks:start -->
## Hooks（13 个自动化钩子）

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
<!-- catalog:hooks:end -->

## MCP 配置

`mcp-configs/` 提供开箱即用的 MCP Server 配置：GitHub · Supabase · Vercel

## 开发

```bash
node scripts/sync-codex.js
node tests/run-all.js
```

## License

MIT
