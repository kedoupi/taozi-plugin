# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目架构

Claude Code 插件 + Codex 适配层的双运行时仓库。

- `agents/` + `skills/` = 单一事实来源（两个运行时共享）
- `hooks/` + `.claude-plugin/` = Claude Code 专用
- `.codex/` + `.codex-plugin/` + `.agents/` = Codex 专用（由脚本生成，禁止手工编辑）

> commands/ 目录已彻底废除 — 所有 `/taozi:xxx` 触发都通过 skills。官方文档 "Custom commands have been merged into skills"。

## 关键命令

```bash
node tests/run-all.js       # 运行全部测试（零依赖）
node scripts/sync-codex.js  # agents/ 或 skills/ 变更后同步 Codex 适配层
npm run lint                # 验证 hooks/hooks.json 格式合法
```

## 修改 agents/ 或 skills/ 后必须做

改动 `agents/*.md` 或 `skills/*/SKILL.md` 后，必须紧跟运行：

```bash
node scripts/sync-codex.js
```

否则 `.codex/agents/` 和 `.agents/skills/` 会与源码不一致。

## 发版检查单

升版本时必须同步这三处，否则 Codex 侧会显示旧版本：

1. `package.json` → `version`
2. `.claude-plugin/plugin.json` → `version` + `description`
3. `.codex-plugin/plugin.json` → `version` + `description`（当前仍需手动更新，sync-codex.js 不会自动同步）
4. `README.md` 首行 `# Taozi Plugin X.Y.Z` → 同步
5. `CHANGELOG.md` → 新增 `[X.Y.Z] - YYYY-MM-DD` 条目（breaking change 必须列迁移对照表）

## frontmatter 约束

`agents/*.md`、`skills/*/SKILL.md` 的 frontmatter **只支持平层 `key: value` 单行格式**，`parseFrontmatter()` 不解析嵌套 YAML。错误示例：

```yaml
# ❌ 嵌套写法会被忽略
author:
  name: foo

# ✅ 正确
author: foo
```

## Hook 开发规范

- `exit(0)` = 放行，`exit(2)` = 拦截（Claude 看到 stderr 作为反馈）
- **`exit(2)` 拦截仅对 `PreToolUse` 有效**；`PostToolUse` hook 无论退出码是什么都不会拦截操作，只作为信息反馈
- 所有 hook 脚本通过 stdin 读取 JSON，用 `require('../lib/utils').readStdinJson()`
- 新 hook 三步走：`scripts/hooks/<name>.js` → `hooks/hooks.json` 注册 → `tests/hooks/hooks.test.js` 补测试
- `${CLAUDE_PLUGIN_ROOT}` 是插件根目录的环境变量，在 hooks.json 命令路径中使用
- `block-random-md` PostToolUse hook 会对任意 `.md` 文件写入输出警告；合法路径（`skills/*/SKILL.md`、`agents/*.md`、`docs/` 等）会静默放行，不要尝试在其他路径创建 `.md` 文件

## CI 结构检查

CI (`test.yml`) 除运行 `node tests/run-all.js` 外，还有结构完整性检查：

- `agents/*.md`、`skills/*/SKILL.md`、`rules/*.md`、`scripts/hooks/*.js` 每个文件**必须存在**
- 改名或删除这些文件会触发 CI lint 失败（不是测试失败，错误信息不同）
- 新增文件时无需担心；只有删除/改名现有文件才会触发

## 测试框架

零依赖，`run-all.js` 通过 `global` 注入 `test()` 和 `assert`，测试文件无需额外引入：

```js
test('描述', () => {
  assert.strictEqual(actual, expected);
});

asyncTest('异步描述', async () => {
  const result = await someAsync();
  assert.strictEqual(result, expected);
});
```

测试文件命名必须以 `.test.js` 结尾才会被自动发现。新增功能必须有对应测试。PR 要求全部测试通过。

## 命名规范

- Skill 目录名 = slash 触发名（`skills/image/` → `/taozi:image`，插件命名空间 `taozi:` 负责区分）

## 场景自动触发规则

Claude Agent 在感知到以下场景时，应主动触发对应 Skill，无需用户手动输入指令：

| 场景 | 主动触发 |
|------|----------|
| 用户描述新功能需求或任务分解 | `/taozi:plan`（重量版 5 阶段：探索 → 澄清 → 方案 → 设计文档 → 实现计划） |
| 用户准备提交代码 | `/taozi:commit`（日常高频） |
| 用户功能完成想本地合并回主分支 | `/taozi:finish`（测试 → `--no-ff` 合并 → 清理分支/worktree） |
| 用户说"发版"、"release"、"升版本" | `/release` |
| 用户改动 `agents/*.md` 或 `skills/*/SKILL.md` | 提醒运行 `node scripts/sync-codex.js` |
| 用户要创建新 Skill | `/taozi:skill-create` |
| 用户遇到构建 / 类型错误 | `/taozi:build-fix` |
| 用户描述 bug / 测试失败 / 意外行为 / "不知道为什么" | `/taozi:debug` |
| 用户说"完成了" / "可以合并" / "done" | `/taozi:finish`（单步：测试 + 本地合并 + 清理；想发 PR 手动 `git push && gh pr create`） |
| 用户需要研究某个技术方案 | `/taozi:research` 或 `/taozi:deep-research` |

触发前告知用户，用户可随时说"跳过"终止。

## Agent 常见错误（必读）

以下是 AI Agent 在此仓库中反复出现的错误，**每次操作前主动对照**：

- **忘跑 sync-codex**：改了 `skills/*/SKILL.md` 或 `agents/*.md` 后未运行 `node scripts/sync-codex.js`，导致 Codex 侧显示旧版本。每次改完 skill/agent 立即 sync。
- **在非法路径创建 .md 文件**：`block-random-md` hook 会拦截在 `skills/*/SKILL.md`、`agents/*.md`、`docs/`、`.claude/skills/` 之外创建的 `.md` 文件。不要在其他任何路径创建 `.md`。
- **frontmatter 写嵌套 YAML**：`parseFrontmatter()` 只支持 `key: value` 单行，嵌套字段会被静默忽略，导致 skill 元数据丢失。
- **在 PostToolUse hook 用 exit(2) 拦截**：PostToolUse 的 exit 码不会拦截任何操作，只有 `PreToolUse` 的 `exit(2)` 才能拦截。用错了 hook 类型，拦截逻辑完全失效。
- **发版漏更新三处版本号**：`package.json` / `.claude-plugin/plugin.json` / `.codex-plugin/plugin.json` 三处必须同步，漏一处 Codex 侧显示旧版本。
