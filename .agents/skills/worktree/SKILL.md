---
name: worktree
description: 为隔离开发场景创建 git worktree，按 Taozi 命名规范放到 ~/.taozi/worktrees/。适合大型重构、并行多功能、保持主分支可用。
allowed-tools: Bash(git:*), Bash(pnpm:*), Bash(yarn:*), Bash(npm:*), Bash(mkdir:*), Bash(basename:*), Bash(cd:*), Read
---

# Worktree

为隔离工作创建 git worktree。通用 git 约束见 [git-conventions](../git-conventions/SKILL.md)。

## 何时使用

- ✅ 大型重构、并行多个功能、需要保持主分支可立即切回
- ❌ 简单 bug 修复、单文件改动 — 直接切分支即可

## 分支命名

参见 [git-conventions](../git-conventions/SKILL.md) 的分支命名段（`feat/` `fix/` `refactor/` `docs/` `chore/`）。

## 创建流程

### 1. 确认基础信息

```bash
git rev-parse --show-toplevel       # 主仓库路径
git worktree list                   # 现有 worktree
git branch --show-current           # 当前分支
```

### 2. 计算路径

```bash
REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
BRANCH=<feat|fix|...>/<description>
WORKTREE_PATH="${TAOZI_HOME:-$HOME/.taozi}/worktrees/$REPO_NAME/$BRANCH"
```

> 路径约定：`$TAOZI_HOME/worktrees/<repo>/<branch>`，方便 `/taozi:finish` 识别并清理。

### 3. 创建并进入

```bash
mkdir -p "$(dirname "$WORKTREE_PATH")"
git worktree add "$WORKTREE_PATH" -b "$BRANCH"
cd "$WORKTREE_PATH"
```

若 `-b` 失败（分支已存在）→ 改用 `git worktree add "$WORKTREE_PATH" "$BRANCH"`（复用已有分支）。

### 4. 安装依赖（按存在的 lockfile 选择）

```bash
if [ -f pnpm-lock.yaml ]; then pnpm install
elif [ -f yarn.lock ]; then yarn install
elif [ -f package-lock.json ]; then npm install
fi
```

非 Node 项目跳过此步。

## 禁止（worktree 专属）

- 禁止路径冲突时静默覆盖，必须报告用户
- 禁止在已有未提交改动的 worktree 中随意 `git worktree remove --force`

## 失败回退

- worktree add 报 `already exists` → 检查 `git worktree list`，必要时 `git worktree remove --force` 已损坏的旧 worktree（前提：确认无未推送改动）
- 路径冲突 → 不要静默覆盖，报告给用户
