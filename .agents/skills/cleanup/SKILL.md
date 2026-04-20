---
name: cleanup
description: PR 合并后清理本地分支与 worktree。安全删除已合并分支，处理 squash-merge 的特殊场景。
allowed-tools: Bash(git:*), Bash(cd:*), Bash(pwd:*), Bash(awk:*), Bash(basename:*), Read
---

# Cleanup

PR 合并后清理本地痕迹。**操作前必须列出将要删除的分支与目录，征得用户确认。**

> worktree 路径约定为 `${TAOZI_HOME:-$HOME/.taozi}/worktrees/<repo>/<branch>`，与 [worktree](../worktree/SKILL.md) skill 保持一致。通用 git 禁止原则见 [git-workflow](../git-workflow/SKILL.md)。

## 流程

### 1. 检测当前位置

```bash
pwd
git rev-parse --git-dir
```

`git-dir` 路径包含 `worktrees/` → 当前在 worktree 中，需先切回主仓库（步骤 2）。

### 2. 切回主仓库（仅当在 worktree 中）

```bash
MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')
cd "$MAIN_REPO"
```

### 3. 检测主分支并更新

```bash
BASE=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
BASE=${BASE:-main}
git checkout "$BASE"
git pull origin "$BASE"
```

`git pull` 失败时**不要用 `||` 静默吞错**，停下来报告原因（网络？冲突？）让用户决定。

### 4. 列出可清理的分支

```bash
git fetch --prune
git branch --merged "$BASE" | grep -vE "^\*|^\s*($BASE|main|master)$"
```

> 注意：使用 `^\s*(main|master)$` 精确匹配，避免误伤 `feature/mainline`、`master-fix` 这类含子串的分支名。

### 5. 处理 squash-merge 分支

squash merge 后本地分支不会被识别为 `--merged`，需另行检查：

```bash
# 假设要检查的分支
BR=<branch-name>
# 该分支的 tip commit 在 base 上是否已通过 squash 合入
git cherry "$BASE" "$BR" | grep -q '^-' && echo "已 squash 合入" || echo "未合入"
```

确认已合入后，使用 `git branch -D "$BR"`（注意 `-D`），但**必须先和用户确认该分支无未推送独有改动**：

```bash
git log origin/"$BR".."$BR" --oneline 2>/dev/null
```

非空 → 有未推送 commit，**不要删**，问用户。

### 6. 删除本地分支

正常合并：

```bash
git branch -d <branch-name>
```

`-d` 失败说明 git 不认为该分支已合并 → 回到步骤 5 用 squash 流程判断，**不要盲目升级到 `-D`**。

### 7. 删除 worktree

```bash
REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
WORKTREE_PATH="${TAOZI_HOME:-$HOME/.taozi}/worktrees/$REPO_NAME/<branch-name>"
[ -d "$WORKTREE_PATH" ] && git worktree remove "$WORKTREE_PATH"
git worktree prune
```

## 禁止（cleanup 专属）

- 禁止用宽松 `grep -v "main"` 过滤分支名（会误伤 `feature/mainline` 这类含子串分支）
- 禁止未确认未推送 commit 就 `git branch -D`
- 禁止批量 `xargs git branch -D` 不经用户复核

> 通用 git 禁止原则（`||` 吞错、--force、--no-verify 等）见 [git-workflow](../git-workflow/SKILL.md)。
