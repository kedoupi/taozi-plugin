---
name: taozi:worktree
description: 创建 Git worktree 隔离开发环境
allowed-tools: Bash(git:*), Bash(pnpm:*), Bash(yarn:*), Bash(npm:*)
argument-hint: [branch-name] 分支名称
---

# Taozi Worktree 隔离开发

## 当前状态

- 仓库: !`basename $(git rev-parse --show-toplevel)`
- 当前分支: !`git branch --show-current`
- 现有 worktrees: !`git worktree list`

## 参数

分支名称: `$ARGUMENTS`

如果未提供分支名称，询问用户：
- 功能类型（feat/fix/refactor/docs/chore）
- 简短描述

## 分支命名规范

- `feat/<description>` - 新功能
- `fix/<description>` - Bug 修复
- `refactor/<description>` - 重构
- `docs/<description>` - 文档
- `chore/<description>` - 杂项

## Worktree 创建流程

```bash
# 1. 获取仓库名称
REPO_NAME=$(basename $(git rev-parse --show-toplevel))

# 2. 设置 worktree 路径
WORKTREE_PATH="$HOME/.claude-worktrees/$REPO_NAME/<branch-name>"

# 3. 创建目录
mkdir -p $(dirname $WORKTREE_PATH)

# 4. 创建 worktree + 分支
git worktree add $WORKTREE_PATH -b <branch-name>

# 5. 切换到 worktree 目录
cd $WORKTREE_PATH
```

## 依赖安装

检测项目类型并安装依赖：

```bash
if [ -f "pnpm-lock.yaml" ]; then
    pnpm install
elif [ -f "yarn.lock" ]; then
    yarn install
elif [ -f "package-lock.json" ]; then
    npm install
fi
```

## 执行

1. 确认或生成分支名称
2. 创建 worktree 到 `~/.claude-worktrees/<repo>/<branch>`
3. 安装依赖（如果是 Node.js 项目）
4. 输出新工作目录路径，提示用户后续操作

## 使用场景

**推荐使用 worktree**：
- 需要保持主分支代码不变
- 并行开发多个功能
- 大型重构任务

**不需要 worktree**：
- 简单的 bug 修复
- 小型功能迭代
