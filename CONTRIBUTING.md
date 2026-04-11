# 贡献指南

感谢你对 Taozi Plugin 的贡献兴趣！本文档介绍如何参与开发。

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/kedoupi/taozi-plugin.git
cd taozi-plugin

# 2. 运行测试验证环境
node tests/run-all.js

# 3. 生成 Codex 适配层
node scripts/sync-codex.js

# 4. 按照需要配置本地插件（见 DEVELOPER.md）
```

## 添加新 Agent

在 `agents/` 目录创建 `<agent-name>.md`，使用简单 frontmatter（仅支持单行 `key: value`）：

```yaml
---
name: agent-name
description: 描述（在什么场景下主动使用此 Agent）
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet | opus | haiku
---

## 角色定位
简要描述 Agent 职责。

## 核心技能
- 技能 1
- 技能 2

## 工作方法
描述工作流程。

## 输出格式
描述输出规范。
```

**要点**：
- `tools` 字段控制 Agent 可用工具，按需授权最小集合
- `model` 选择原则：`opus` 用于复杂推理，`sonnet` 用于日常任务（默认），`haiku` 用于简单查询
- 核心内容控制在 30-50 行，详细示例迁移到 `skills/`
- 修改 `agents/` 后运行 `node scripts/sync-codex.js`，同步 `.codex/agents/`

## 添加新 Skill

1. 在 `skills/` 下创建目录：`skills/<skill-name>/`
2. 创建 `SKILL.md` 主文件（仅支持单行 `key: value` frontmatter）：

```yaml
---
name: skill-name
description: 描述（何时自动引用此 Skill）
---

## 内容标题
...
```

3. 如有参考资料，放入 `references/` 子目录
4. 如有脚本模板，放入 `scripts/` 子目录
5. 修改 `skills/` 后运行 `node scripts/sync-codex.js`，同步 `.agents/skills/`

## 添加新 Hook

1. 在 `scripts/hooks/` 创建脚本 `<hook-name>.js`：

```javascript
#!/usr/bin/env node
const { readStdinJson, log, error } = require('../lib/utils');

const input = readStdinJson();
if (!input || !input.tool_input) {
  process.exit(0); // 允许
}

// 检查逻辑...
if (shouldBlock) {
  error('阻止原因说明');
  process.exit(2); // exit(2) = 阻止工具调用
}

process.exit(0); // 允许
```

**退出码约定**：
- `exit(0)` — 允许工具调用继续
- `exit(2)` — 阻止工具调用（Claude Code 会看到 stderr 输出）

2. 在 `hooks/hooks.json` 中注册：

```json
{
  "hooks": {
    "事件名": [
      {
        "matcher": "工具名匹配模式",
        "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/your-hook.js\"" }],
        "description": "描述",
        "id": "唯一标识"
      }
    ]
  }
}
```

**可用事件**：`PreToolUse`, `PostToolUse`, `SessionStart`, `Stop`, `PreCompact`

## 添加新 Rule

在 `rules/` 目录创建 `<rule-name>.md`：

```markdown
# 规则标题

> 简短摘要

## 主要规则
- 规则 1
- 规则 2

## 示例
...
```

Rules 是 Claude 会在对话中自动遵循的约束规范。与 Skills 的区别：
- **Rules** = 必须遵守的约束（编码风格、安全底线、Git 规范）
- **Skills** = 按需引用的知识库（框架用法、模式参考）

## 测试

运行全部测试：

```bash
node tests/run-all.js
```

添加新测试：在 `tests/` 目录下创建 `<category>.test.js` 文件。测试使用零依赖 Node.js assert：

```javascript
// tests/my-feature/my-test.test.js
const assert = require('assert');
const { someFunction } = require('../../scripts/lib/utils');

test('功能描述', () => {
  assert.strictEqual(someFunction('input'), 'expected');
});
```

`test()` 和 `assert` 由 `run-all.js` 全局注入，无需额外引入。

## PR 工作流

1. **分支命名**：`feat/<feature-name>`, `fix/<bug-name>`, `docs/<topic>`
2. **提交格式**：Conventional Commits
   ```
   feat: 添加新功能
   fix: 修复某问题
   docs: 更新文档
   refactor: 重构代码
   test: 添加测试
   ```
3. **测试要求**：所有 PR 必须通过 `node tests/run-all.js`（当前 470 个测试）
4. **提交前检查**：
   - 新功能有对应测试
   - 所有测试通过
   - 文档已更新（如适用）

## 开发者配置

详见 [DEVELOPER.md](DEVELOPER.md) 的「开发者本地配置」章节，配置本地插件加载。

## 相关链接

- [开发者指南](DEVELOPER.md)
- [README](README.md)
