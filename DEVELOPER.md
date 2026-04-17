# Taozi 插件开发者指南

本文档记录了开发 Taozi 在 Claude Code / Codex 双运行时下的配置方式和踩坑经验。

## 📋 目录

- [核心概念](#核心概念)
- [目录结构](#目录结构)
- [配置文件详解](#配置文件详解)
- [双运行时架构](#双运行时架构)
- [踩坑记录](#踩坑记录)
- [开发者本地配置](#开发者本地配置)
- [用户安装方式](#用户安装方式)
- [Hooks 架构](#hooks-架构)
- [Rules 架构](#rules-架构)
- [测试框架](#测试框架)
- [Scripts 工具库](#scripts-工具库)

---

## 双运行时架构

Taozi 现在采用“共享内容 + 运行时适配层”结构：

- `agents/`：Agent 定义单一事实来源
- `skills/`：Skill 定义单一事实来源（承载所有 `/taozi:xxx` 触发）
- `hooks/`、`.claude-plugin/`：Claude Code 专用层
- `AGENTS.md`、`.codex/`、`.codex-plugin/`、`.agents/`：Codex 专用层

其中：

- `.codex/agents/` 由 `agents/*.md` 生成
- `.agents/skills/` 由 `skills/` 镜像生成
- 同步命令：`node scripts/sync-codex.js`
- 所有 slash 触发走 `skills/*/SKILL.md`（官方 "Custom commands have been merged into skills"），不再维护 `commands/` 目录

设计原则：

1. 不在 Claude / Codex 两侧手工维护同一份知识
2. 共享内容放在 `agents/` 和 `skills/`
3. 各运行时只保留自己的入口和配置

---

## 核心概念

### 命名格式

```
插件名@marketplace名
例如：taozi@kedoupi
```

- `taozi` = 插件名（在 `plugin.json` 中定义）
- `kedoupi` = marketplace 名（在 `marketplace.json` 中定义）

### 两个角色

| 角色 | 需求 | 配置方式 |
|------|------|----------|
| **开发者** | 本地加载，可调试修改 | `known_marketplaces.json` 用 `source: "directory"` |
| **用户** | 从 GitHub 下载安装 | `marketplace.json` 用 `source: "url"` |

---

## 目录结构

```
~/.claude/plugins/taozi/          # 插件目录（也是 Git 仓库）
├── .git/                         # Git 仓库，推送到 GitHub
├── .claude-plugin/
│   ├── plugin.json               # 插件清单（必需）
│   └── marketplace.json          # marketplace 定义（分发用）
├── agents/                       # 子代理定义
│   └── *.md
├── hooks/                        # Hook 配置
│   └── hooks.json                # 8 个 Hook，5 个事件
├── rules/                        # 规则文件
│   ├── iron-rules.md             # 3 条铁律
│   ├── coding-style.md           # 编码风格
│   ├── git-workflow.md           # Git 工作流
│   ├── testing.md                # 测试规范
│   ├── security.md               # 安全规范
│   └── performance.md            # 性能规范
├── scripts/                      # 脚本
│   ├── lib/utils.js              # 共享工具库
│   └── hooks/                    # Hook 脚本（8 个）
├── skills/                       # 技能库
│   └── */SKILL.md
├── tests/                        # 测试（当前 467 个）
│   ├── run-all.js                # 测试运行器
│   ├── lib/utils.test.js
│   ├── agents/agents.test.js
│   ├── skills/skills.test.js
│   ├── hooks/hooks.test.js
│   └── rules/rules.test.js
├── README.md                     # 用户文档
├── DEVELOPER.md                  # 本文件
└── CONTRIBUTING.md               # 贡献指南
```

---

## 配置文件详解

### 1. plugin.json（插件清单）

```json
{
  "name": "taozi",
  "version": "1.0.0",
  "description": "插件描述",
  "author": {
    "name": "作者名"
  },
  "keywords": ["workflow", "git"]
}
```

### 2. marketplace.json（分发配置）

```json
{
  "name": "kedoupi",
  "owner": { "name": "kedoupi" },
  "plugins": [
    {
      "name": "taozi",
      "source": {
        "source": "url",
        "url": "https://github.com/kedoupi/taozi-plugin.git"
      },
      "description": "插件描述",
      "version": "1.0.0"
    }
  ]
}
```

### 3. known_marketplaces.json（开发者本地配置）

位置：`~/.claude/plugins/known_marketplaces.json`

```json
{
  "kedoupi": {
    "source": {
      "source": "directory",
      "path": "/Users/你的用户名/.claude/plugins/taozi"
    },
    "installLocation": "/Users/你的用户名/.claude/plugins/taozi",
    "lastUpdated": "2026-01-14T00:50:00.000Z"
  }
}
```

### 4. installed_plugins.json（已安装插件注册）

位置：`~/.claude/plugins/installed_plugins.json`

```json
{
  "taozi@kedoupi": [
    {
      "scope": "user",
      "installPath": "/Users/你的用户名/.claude/plugins/taozi",
      "version": "1.0.0",
      "installedAt": "2026-01-14T00:50:00.000Z",
      "lastUpdated": "2026-01-14T00:50:00.000Z"
    }
  ]
}
```

### 5. settings.json（启用插件）

位置：`~/.claude/settings.json`

```json
{
  "enabledPlugins": {
    "taozi@kedoupi": true
  }
}
```

---

## 踩坑记录

### ❌ 坑 1：marketplace.json 的 source 格式

**错误写法**：
```json
"source": "."
"source": "./"
```

**报错**：`Invalid schema: plugins.0.source: Invalid input`

**正确写法**：
```json
// 方式 1：子目录路径（官方用法）
"source": "./plugins/taozi"

// 方式 2：URL 对象格式（推荐）
"source": {
  "source": "url",
  "url": "https://github.com/kedoupi/taozi-plugin.git"
}
```

**结论**：单插件仓库请使用 URL 对象格式。

---

### ❌ 坑 2：命名混乱

**错误**：
- 用了 `taozi@local`、`taozi@taozi-dev` 等各种名字
- 不清楚 `@` 前后分别是什么

**正确理解**：
```
taozi@kedoupi
  │      │
  │      └── marketplace 名（在 marketplace.json 的 name 字段）
  └── 插件名（在 plugin.json 的 name 字段）
```

---

### ❌ 坑 3：以为 ~/.claude/plugins/ 会自动扫描

**错误想法**：把插件放在 `~/.claude/plugins/taozi/` 就会自动加载

**现实**：Claude Code 不会自动扫描该目录下的子目录

**正确做法**：必须在以下文件中注册：
1. `known_marketplaces.json` - 注册 marketplace
2. `installed_plugins.json` - 注册已安装的插件
3. `settings.json` - 启用插件

---

### ❌ 坑 4：开发目录放哪

**纠结**：放 `~/Coding/taozi-plugin/` 还是 `~/.claude/plugins/taozi/`？

**结论**：放哪都可以！关键是 `known_marketplaces.json` 中的 path 指向正确。

推荐放在 `~/.claude/plugins/taozi/`，因为：
- 集中管理
- 路径简单
- 不需要额外配置 `extraKnownMarketplaces`

---

### ❌ 坑 5：extraKnownMarketplaces vs known_marketplaces.json

**两种方式都可以**：

方式 A：在 `~/.claude/settings.json` 中添加：
```json
{
  "extraKnownMarketplaces": {
    "kedoupi": {
      "source": {
        "source": "directory",
        "path": "/path/to/plugin"
      }
    }
  }
}
```

方式 B：直接修改 `~/.claude/plugins/known_marketplaces.json`（推荐）

---

## 开发者本地配置

### 一次性配置步骤

1. **创建插件目录**
   ```bash
   mkdir -p ~/.claude/plugins/taozi/.claude-plugin
   ```

2. **添加 marketplace 到 known_marketplaces.json**
   ```bash
   # 编辑 ~/.claude/plugins/known_marketplaces.json
   # 添加 kedoupi 条目（见上文）
   ```

3. **注册插件到 installed_plugins.json**
   ```bash
   # 编辑 ~/.claude/plugins/installed_plugins.json
   # 添加 taozi@kedoupi 条目（见上文）
   ```

4. **启用插件**
   ```bash
   # 编辑 ~/.claude/settings.json
   # 在 enabledPlugins 中添加 "taozi@kedoupi": true
   ```

5. **重启 Claude Code**
   ```bash
   # 退出并重新启动 Claude Code
   /help  # 验证是否显示 taozi@kedoupi
   ```

### 日常开发流程

1. 修改 `~/.claude/plugins/taozi/` 下的文件
2. 重启 Claude Code 生效
3. 测试功能
4. 提交并推送到 GitHub

---

## 用户安装方式

### 方式 1：通过 marketplace（推荐）

```bash
# 1. 添加 marketplace 源
/plugin marketplace add kedoupi/taozi-plugin

# 2. 安装插件
/plugin install taozi@kedoupi

# 3. 使用
/taozi 实现登录功能
/commit
```

### 方式 2：克隆到本地

```bash
# 克隆仓库
cd ~/.claude/plugins
git clone https://github.com/kedoupi/taozi-plugin.git taozi

# 然后手动配置（同开发者配置步骤）
```

---

## 常见问题

### Q: 修改插件后不生效？
A: 重启 Claude Code

### Q: 报错 Invalid schema？
A: 检查 marketplace.json 的 source 格式，使用 URL 对象格式

### Q: 插件不显示？
A: 检查以下文件是否都配置正确：
- `known_marketplaces.json`
- `installed_plugins.json`
- `settings.json`

### Q: 命名应该用什么格式？
A: `插件名@marketplace名`，例如 `taozi@kedoupi`

---

---

## 扩展指南

### 添加新代理

1. 在 `agents/` 目录创建 `<agent-name>.md`
2. 使用简单 frontmatter（仅支持单行 `key: value`）：

```yaml
---
name: agent-name
description: 描述（在什么场景主动使用）
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet | opus | haiku
---
```

3. 使用标准结构：
```markdown
## 角色定位
## 核心技能
## 工作方法
## 输出格式
## 最佳实践
## 相关 Skills（如有）
```

4. 在 `skills/taozi/SKILL.md` 中注册新代理

### 添加新 Skill

1. 在 `skills/` 目录创建新目录：`skills/<skill-name>/`
2. 创建 `SKILL.md` 主文件：

```yaml
---
name: skill-name
description: 描述（何时使用此 skill）
---
```

3. 如有详细内容，放入 `references/` 子目录
4. 如有脚本模板，放入 `scripts/` 子目录

### 添加新 Slash 触发（原 "命令"）

> 官方 Claude Code 已将 commands 合并进 skills。统一以 skill 形式提供。

1. 在 `skills/` 目录创建 `<skill-name>/SKILL.md`
2. 使用简单 frontmatter（仅支持单行 `key: value`）：

```yaml
---
name: skill-name
description: 描述（触发时机与用途，Claude 靠它自动匹配）
allowed-tools: Tool1, Tool2
argument-hint: [参数说明]
---
```

3. 触发形式：`/taozi:<skill-name>`（插件命名空间 `taozi:` 由 plugin.json 自动注入）

### 代理模板规范

- 核心内容控制在 30-50 行
- 详细示例迁移到 skills/
- 在末尾添加 `## 相关 Skills` 引用
- 统一使用中文描述

### 模型选择原则

- **opus**: 复杂推理、架构设计、深度分析
- **sonnet**: 日常开发任务（默认选择）
- **haiku**: 简单查询、快速验证

---

## Hooks 架构

### 工作原理

Hooks 是 Claude Code 插件的自动化拦截机制。当特定事件触发时，Claude Code 执行对应的脚本，通过退出码决定是否允许操作继续。

**退出码约定**：
- `exit(0)` — 允许，操作继续
- `exit(2)` — 阻止，操作被拦截（Claude 会看到 stderr 输出作为反馈）

**数据流**：Claude Code 通过 stdin 传入 JSON（包含 `tool_input` 等字段），脚本通过 stdout/stderr 返回信息。

### 5 个事件

| 事件 | 触发时机 | 典型用途 |
|------|---------|---------|
| `PreToolUse` | 工具调用前 | 拦截危险命令、提供建议 |
| `PostToolUse` | 工具调用后 | 后置检查、质量守卫 |
| `SessionStart` | 会话启动时 | 加载上下文、恢复状态 |
| `Stop` | 会话结束时 | 保存状态、清理资源 |
| `PreCompact` | 上下文压缩前 | 保留关键信息 |

### 8 个内置 Hook

| ID | 事件 | 描述 |
|----|------|------|
| `pre:bash:no-verify` | PreToolUse | 阻止 `git --no-verify`（铁律 1 强制执行） |
| `pre:bash:tmux-hint` | PreToolUse | dev server 建议使用 tmux |
| `post:edit:console-warn` | PostToolUse | 编辑后检测 `console.log` 语句 |
| `post:write:block-random-md` | PostToolUse | 阻止随意创建 `.md` 文件 |
| `session:start` | SessionStart | 会话启动时加载上次上下文 |
| `stop:session-end` | Stop | 会话结束时保存状态 |
| `pre:compact` | PreCompact | 压缩前保存关键上下文 |

### hooks.json 格式

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/your-hook.js\"" }],
        "description": "描述",
        "id": "唯一标识"
      }
    ]
  }
}
```

- `matcher`：工具名匹配（支持 `|` 分隔多个，如 `"Edit|Write"`，`"*"` 匹配所有）
- `${CLAUDE_PLUGIN_ROOT}`：插件根目录环境变量

### 如何添加新 Hook

1. 在 `scripts/hooks/` 创建脚本（使用 `require('../lib/utils')` 共享工具）
2. 在 `hooks/hooks.json` 中注册
3. 在 `tests/hooks/hooks.test.js` 添加对应测试

---

## Rules 架构

### Rules vs Skills

| 维度 | Rules | Skills |
|------|-------|--------|
| 性质 | 必须遵守的约束 | 按需引用的知识 |
| 加载方式 | 对话中自动遵循 | 任务相关时自动引用 |
| 内容 | 编码风格、安全底线、Git 规范 | 框架用法、模式参考、工具链 |
| 违反后果 | 被视为错误行为 | 最多是缺少最佳实践 |

### 6 个 Rule 文件

| 文件 | 描述 |
|------|------|
| `iron-rules.md` | 3 条铁律：调试铁律、TDD 铁律、验证铁律 |
| `coding-style.md` | 编码风格：不可变性优先、命名规范、函数式倾向 |
| `git-workflow.md` | Git 规范：Conventional Commits、分支策略 |
| `testing.md` | 测试规范：覆盖率要求、TDD 流程 |
| `security.md` | 安全规范：输入验证、密钥管理、依赖安全 |
| `performance.md` | 性能规范：模型选择策略、过早优化原则 |

### 共通 vs 特定

当前 Rules 均为语言无关的通用规范。未来可按需添加语言特定规则（如 `rules/typescript.md`），Claude 会根据项目技术栈自动应用对应规则。

---

## 测试框架

### 零依赖设计

测试框架使用纯 Node.js `assert` 模块，不依赖任何第三方测试库（jest、mocha 等）。

- **运行器**：`tests/run-all.js` 自动发现并执行所有 `*.test.js` 文件
- **API**：全局注入 `test(name, fn)` 和 `assert`
- **运行**：`node tests/run-all.js`

### 227 个测试覆盖

| 测试文件 | 覆盖范围 |
|---------|---------|
| `lib/utils.test.js` | 共享工具库（文件操作、Git 工具、frontmatter 解析等） |
| `agents/agents.test.js` | Agent 定义结构验证（frontmatter、必填字段） |
| `skills/skills.test.js` | Skill 定义结构验证（SKILL.md 存在性、frontmatter） |
| `hooks/hooks.test.js` | Hook 脚本验证（hooks.json 格式、脚本存在性） |
| `rules/rules.test.js` | Rule 文件验证（文件存在性、内容非空） |

### 如何添加新测试

在 `tests/` 目录创建 `*.test.js` 文件：

```javascript
// tests/my-feature/my-test.test.js
const assert = require('assert');
const { someFunction } = require('../../scripts/lib/utils');

test('功能描述', () => {
  assert.strictEqual(someFunction('input'), 'expected');
});
```

`test()` 和 `assert` 由 `run-all.js` 通过 `global` 注入，无需额外引入。

---

## Scripts 工具库

### 共享工具 (`scripts/lib/utils.js`)

所有 Hook 脚本共享的工具函数库，提供：

| 模块 | 函数 | 用途 |
|------|------|------|
| 日志 | `log()`, `warn()`, `error()` | 统一前缀 `[Taozi]` 的 stderr 输出 |
| 输入 | `readStdinJson()` | 读取 Claude Code stdin JSON |
| 文件 | `ensureDir()`, `readFile()`, `writeFile()`, `readJson()`, `writeJson()` | 文件读写操作 |
| 搜索 | `findFiles(dir, pattern)` | 递归文件搜索 |
| Git | `isGitRepo()`, `getGitRoot()`, `getGitModifiedFiles()` | Git 仓库信息 |
| 日期 | `getDateString()`, `getDateTimeString()` | ISO 格式日期字符串 |
| 路径 | `getPluginRoot()`, `getTaoziDir()`, `getSessionsDir()` | 插件和数据目录 |
| 解析 | `parseFrontmatter(content)` | 扁平 frontmatter 解析（仅支持 `key: value`） |

### Hook 脚本 (`scripts/hooks/`)

每个 Hook 脚本遵循统一模式：

```javascript
#!/usr/bin/env node
const { readStdinJson, error } = require('../lib/utils');

const input = readStdinJson();
if (!input || !input.tool_input) {
  process.exit(0); // 无有效输入，允许继续
}

// 检查逻辑
if (shouldBlock) {
  error('阻止原因');
  process.exit(2); // 阻止
}

process.exit(0); // 允许
```

---

## 相关链接

- [GitHub 仓库](https://github.com/kedoupi/taozi-plugin)
- [Claude Code 官方文档](https://docs.anthropic.com/claude-code)

---

*最后更新：2026-04-07*
