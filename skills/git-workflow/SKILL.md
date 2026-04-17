---
name: git-workflow
description: Git 工作流 — 创建提交、准备 PR、创建 worktree、清理分支的规范操作
allowed-tools: Bash(git:*), Bash(gh:*), Bash(pnpm:*), Bash(yarn:*), Bash(npm:*), Read, Grep
---

# Git Workflow

Taozi Git 工作流统一入口。涵盖 commit / pr / worktree / cleanup 四个子场景。

## 何时使用

- 准备提交当前改动 → 见 [Commit](#commit)
- 推送分支并创建 PR → 见 [PR](#pr)
- 为大任务创建隔离 worktree → 见 [Worktree](#worktree)
- PR 合并后清理分支 → 见 [Cleanup](#cleanup)

## 基本原则

- 不在 `main` 或 `master` 上直接做危险操作
- 不使用 `--no-verify` 跳过校验，除非用户明确要求
- 提交前先看 diff，必要时拆成多个提交
- 推送前确认分支名、远程和未提交变更

---

## Commit

### 当前状态

- 分支: !`git branch --show-current`
- 状态: !`git status --porcelain`
- 已暂存: !`git diff --cached --stat`
- 未暂存: !`git diff --stat`

### 提交流程

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

### 提交格式

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

### 提交规范

- 现在时祈使语气（"添加功能" 而非 "添加了功能"）
- 第一行 ≤ 72 字符
- 关注"为什么"而非"是什么"
- 永远不要 `--no-verify` 跳过 hooks（除非用户明确要求）

### 执行

```bash
git commit -m "$(cat <<'EOF'
<emoji> <type>: <description>

<body if needed>
EOF
)"
```

---

## PR

### 当前状态

- 分支: !`git branch --show-current`
- 远程: !`git remote -v | head -2`
- 未提交变更: !`git status --porcelain`
- 本地提交（未推送）: !`git log @{u}..HEAD --oneline 2>/dev/null`

### 前置检查

1. **禁止直接操作主分支**：当前分支是 `main`/`master` 时停止
2. **未提交变更**：如有未提交变更，询问是否先执行 commit

### PR 流程

**1. 推送到远程**

```bash
git push -u origin <branch-name>
```

**2. 创建 PR**

```bash
gh pr create --title "<emoji> <type>: <description>" --body "$(cat <<'EOF'
## Summary
<1-3 bullet points 变更摘要>

## Changes
- <具体变更 1>

## Test Plan
- [ ] <测试项 1>

🤖 Generated with Claude Code
EOF
)"
```

### PR 规则

- 标题应与提交语义一致
- 正文至少包含 Summary、Changes、Test Plan

---

## Worktree

### 当前状态

- 仓库: !`basename $(git rev-parse --show-toplevel)`
- 分支: !`git branch --show-current`
- 现有 worktrees: !`git worktree list`

### 分支命名规范

- `feat/<description>` — 新功能
- `fix/<description>` — Bug 修复
- `refactor/<description>` — 重构
- `docs/<description>` — 文档
- `chore/<description>` — 杂项

### 创建流程

```bash
REPO_NAME=$(basename $(git rev-parse --show-toplevel))
WORKTREE_PATH="${TAOZI_HOME:-$HOME/.taozi}/worktrees/$REPO_NAME/<branch-name>"

mkdir -p $(dirname $WORKTREE_PATH)
git worktree add $WORKTREE_PATH -b <branch-name>
cd $WORKTREE_PATH
```

### 依赖安装

```bash
if [ -f "pnpm-lock.yaml" ]; then pnpm install
elif [ -f "yarn.lock" ]; then yarn install
elif [ -f "package-lock.json" ]; then npm install
fi
```

### 使用场景

**推荐**：保持主分支不变、并行多功能、大型重构
**不需要**：简单 bug 修复、小型迭代

---

## Cleanup

### 当前状态

- 当前目录: !`pwd`
- 分支: !`git branch --show-current`
- Worktrees: !`git worktree list`
- 已合并分支: !`git branch --merged main 2>/dev/null || git branch --merged master`

### 清理流程

**1. 检查是否在 worktree 中**

```bash
git rev-parse --git-dir | grep -q "worktrees" && echo "在 worktree 中" || echo "在主仓库中"
```

**2. 如果在 worktree 中，切回主仓库**

```bash
MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')
cd $MAIN_REPO
```

**3. 更新主分支**

```bash
git checkout main || git checkout master
git pull origin main || git pull origin master
```

**4. 删除 worktree（如存在）**

```bash
WORKTREE_PATH="${TAOZI_HOME:-$HOME/.taozi}/worktrees/<repo>/<branch-name>"
[ -d "$WORKTREE_PATH" ] && git worktree remove $WORKTREE_PATH
```

**5. 删除本地分支**

```bash
git branch -d <branch-name>
```

**6. 清理远程引用**

```bash
git fetch --prune
```

### 批量清理

```bash
git branch --merged main | grep -v "main\|master" | xargs -r git branch -d
git worktree prune
```

### 清理原则

- 清理前确认 PR 已合并或分支无需保留
- 删除前确认当前不在目标 worktree 内
- 清理操作必须明确说明将删除哪些本地资源
