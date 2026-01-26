---
name: taozi:pr
description: 推送分支并创建 GitHub PR
allowed-tools: Bash(git:*), Bash(gh:*)
---

# Taozi PR 流程

## 当前状态

- 分支: !`git branch --show-current`
- 远程: !`git remote -v | head -2`
- 未提交变更: !`git status --porcelain`
- 本地提交 (未推送): !`git log @{u}..HEAD --oneline 2>/dev/null || echo "无上游分支"`

## 前置检查

1. **禁止直接操作主分支**
   - 如果当前分支是 `main` 或 `master`，停止并提示用户先创建功能分支

2. **未提交变更处理**
   - 如果有未提交的变更，询问用户是否先提交（使用 `/taozi:commit`）

## PR 流程

### 1. 推送到远程

```bash
git push -u origin <branch-name>
```

### 2. 创建 PR

使用 `gh pr create` 创建 PR，标题格式与提交消息一致（emoji + 约定式）：

```bash
gh pr create --title "<emoji> <type>: <description>" --body "$(cat <<'EOF'
## Summary
<1-3 bullet points 变更摘要>

## Changes
- <具体变更 1>
- <具体变更 2>

## Test Plan
- [ ] <测试项 1>
- [ ] <测试项 2>

🤖 Generated with Claude Code
EOF
)"
```

## PR 标题 Emoji

| Emoji | Type | 说明 |
|-------|------|------|
| ✨ | feat | 新功能 |
| 🐛 | fix | Bug 修复 |
| 📝 | docs | 文档 |
| ♻️ | refactor | 重构 |
| ⚡️ | perf | 性能优化 |
| ✅ | test | 测试 |
| 🔧 | chore | 配置/工具 |

## 执行

1. 分析本地提交历史，生成 PR 标题和描述
2. 推送分支到远程
3. 创建 PR 并返回 PR URL
