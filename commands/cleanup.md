---
name: cleanup
description: PR 合并后清理 worktree 和分支
allowed-tools: Bash(git:*)
argument-hint: [branch-name] 可选，默认当前分支
---

# Taozi 清理流程

## 当前状态

- 当前目录: !`pwd`
- 当前分支: !`git branch --show-current`
- Worktrees: !`git worktree list`
- 本地分支: !`git branch`
- 已合并分支: !`git branch --merged main 2>/dev/null || git branch --merged master`

## 清理目标

分支名称: `$ARGUMENTS`（默认当前分支）

## 清理流程

### 1. 检查是否在 worktree 中

```bash
# 检查当前目录是否是 worktree
git rev-parse --git-dir | grep -q "worktrees" && echo "在 worktree 中" || echo "在主仓库中"
```

### 2. 如果在 worktree 中，先切回主仓库

```bash
# 获取主仓库路径
MAIN_REPO=$(git worktree list | head -1 | awk '{print $1}')
cd $MAIN_REPO
```

### 3. 更新主分支

```bash
git checkout main || git checkout master
git pull origin main || git pull origin master
```

### 4. 删除 worktree（如果存在）

```bash
REPO_NAME=$(basename $(git rev-parse --show-toplevel))
WORKTREE_PATH="$HOME/.claude-worktree/$REPO_NAME/<branch-name>"

if [ -d "$WORKTREE_PATH" ]; then
    git worktree remove $WORKTREE_PATH
fi
```

### 5. 删除本地分支

```bash
git branch -d <branch-name>
```

### 6. 清理远程引用

```bash
git fetch --prune
```

## 批量清理已合并分支

如果用户请求清理所有已合并分支：

```bash
# 列出所有已合并到 main 的分支（排除 main 和 master）
git branch --merged main | grep -v "main\|master" | xargs -r git branch -d

# 清理对应的 worktrees
git worktree prune
```

## 执行

1. 确认要清理的分支
2. 如果在 worktree 中，切回主仓库
3. 更新主分支
4. 删除 worktree 和本地分支
5. 清理远程引用
6. 报告清理结果
