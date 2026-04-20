---
name: commit
description: Git 提交快捷入口 — emoji + 约定式格式，暂存检查，自动拆分提交。/taozi:git-workflow commit 章节的专用触发别名
allowed-tools: Bash(git:*), Read, Grep
---

# Commit

`/taozi:git-workflow` commit 子场景的专用入口，逻辑与 git-workflow 保持一致。

## 当前状态

- 分支: !`git branch --show-current`
- 状态: !`git status --porcelain`
- 已暂存: !`git diff --cached --stat`
- 未暂存: !`git diff --stat`

## 提交流程

**1. 暂存检查**

如果没有文件被暂存（`git diff --cached` 为空）：
- 显示所有变更文件
- 询问用户是否暂存所有变更或选特定文件

**2. 目录上下文检测**

- 目录文件数 ≥ 3 且无 `CLAUDE.md` → 询问是否创建
- 有 `CLAUDE.md` → 询问是否需要更新

**3. 分析变更并提交**

1. 执行 `git diff --cached` 分析已暂存更改
2. 判断是否需要拆分为多个提交
3. 使用 **emoji + 约定式提交格式**

## 提交格式

`<emoji> <type>: <description>`

| Emoji | Type | 说明 |
|-------|------|------|
| ✨ | feat | 新功能 |
| 🐛 | fix | Bug 修复 |
| 📝 | docs | 文档 |
| 🎨 | style | 代码格式 |
| ♻️ | refactor | 重构 |
| ⚡️ | perf | 性能优化 |
| ✅ | test | 测试 |
| 🔧 | chore | 配置/工具 |
| 🚀 | ci | CI/CD |
| ⏪️ | revert | 回退 |
| 🚧 | wip | 进行中 |

**更多**：🏷️ 类型定义 / 🌐 i18n / 👔 业务逻辑 / 🚸 UX / 💥 重大变更 / 🚑️ 紧急修复 / 🔒️ 安全 / 🩹 简单修复 / 💚 修 CI / 💡 注释 / 💄 UI / 🚚 移动重命名 / ⚰️ 删无用代码 / ➕ 加依赖 / ➖ 删依赖 / 🎉 初始提交

## 提交规范

- 现在时祈使语气（"添加功能" 而非 "添加了功能"）
- 第一行 ≤ 72 字符
- 关注"为什么"而非"是什么"
- 永远不要 `--no-verify` 跳过 hooks（除非用户明确要求）

## 执行

```bash
git commit -m "$(cat <<'EOF'
<emoji> <type>: <description>

<body if needed>
EOF
)"
```
