# Taozi 插件开发者指南

本文档记录了开发 Claude Code 插件过程中踩过的所有坑，希望能帮助后来者少走弯路。

## 📋 目录

- [核心概念](#核心概念)
- [目录结构](#目录结构)
- [配置文件详解](#配置文件详解)
- [踩坑记录](#踩坑记录)
- [开发者本地配置](#开发者本地配置)
- [用户安装方式](#用户安装方式)

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
├── commands/                     # 斜杠命令
│   └── *.md
├── skills/                       # 技能库
│   └── */SKILL.md
├── README.md                     # 用户文档
└── DEVELOPER.md                  # 本文件
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
2. 使用标准 YAML frontmatter：

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

4. 在 `commands/taozi.md` 中注册新代理

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

### 添加新命令

1. 在 `commands/` 目录创建 `<command-name>.md`
2. 使用标准 YAML frontmatter：

```yaml
---
name: command-name
description: 描述
allowed-tools: Tool1, Tool2
argument-hint: [参数说明]
---
```

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

## 相关链接

- [GitHub 仓库](https://github.com/kedoupi/taozi-plugin)
- [Claude Code 官方文档](https://docs.anthropic.com/claude-code)

---

*最后更新：2026-01-18*
