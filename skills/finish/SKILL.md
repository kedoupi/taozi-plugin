---
name: finish
description: 分支收尾 — 跑测试 → 本地 merge (--no-ff) → 删分支/worktree。默认不推送 main，想发 PR 请手动 git push。
allowed-tools: Read, Bash, Grep, Glob
---

# Finish

功能完成后的一键收尾：**测试验证 → 本地合并到 base → 清理分支和 worktree**。通用 git 约束见 [git-conventions](../git-conventions/SKILL.md)。

**门禁：前置检查或测试失败 → 禁止执行合并步骤，必须修复后重跑。**

## 何时使用

- 在 feature 分支上开发完成，想本地合并回主分支
- **不想**走 PR 流程（走 PR 的话手动 `git push && gh pr create`，不要用 finish）

> 如使用 worktree 开发，请在**主 worktree** 执行本 skill，而非 feature worktree — 否则 Step 4 `git checkout $BASE` 会因 base 已在其他 worktree 签出而失败。

## 前置检查

### 1. 当前分支不在保护分支

```bash
CURRENT=$(git branch --show-current)
case "$CURRENT" in
  main|master|develop) echo "FAIL: 当前在保护分支 $CURRENT，禁止 finish"; exit 1 ;;
esac
```

### 2. 工作区干净

```bash
if [ -n "$(git status --porcelain)" ]; then
  echo "FAIL: 工作区有未提交改动，先 commit 或 stash"; exit 1
fi
```

### 3. 动态检测 base 分支

```bash
BASE=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
BASE=${BASE:-main}
```

## 执行步骤

### 1. 全量测试

```bash
node tests/run-all.js
```

失败则停止，列出失败用例。

### 2. Diff 最终审查

```bash
git fetch origin "$BASE" 2>/dev/null
git diff "origin/$BASE" --stat
```

逐文件确认：无意外改动、无遗留临时代码、无无关文件。

### 3. Commit 规范检查

```bash
git log --oneline "origin/$BASE"..HEAD
```

每条须符合 `<emoji> <type>: <description>` 格式（emoji 表见 [git-conventions](../git-conventions/SKILL.md)）。

### 4. 切回 base 并同步

```bash
FEATURE="$CURRENT"
git checkout "$BASE"
git pull --ff-only origin "$BASE"
```

若 `pull --ff-only` 失败 → base 有新改动但无法快进，停止，让用户手动解决。

### 5. 合并（--no-ff）

```bash
git merge --no-ff "$FEATURE" -m "Merge branch '$FEATURE'"
```

若冲突 → 停止，让用户手动解决冲突后重跑。

### 6. 清理 worktree（如适用）

`git branch -d` 会拒绝删除仍在 worktree 中签出的分支，因此**必须先移除 worktree**。

```bash
WT_PATH=$(git worktree list --porcelain | awk -v b="$FEATURE" '
  /^worktree /{wt=$2}
  /^branch / && $2=="refs/heads/"b {print wt}
')
if [ -n "$WT_PATH" ]; then
  git worktree remove "$WT_PATH"
fi
```

若 `worktree remove` 因未提交改动失败 → 停止，让用户处理（Step 2 前置检查本应拦截，但 worktree 内部可能有独立未跟踪文件）。

### 7. 删除 feature 分支

```bash
git branch -d "$FEATURE"
```

若 `-d` 拒绝（有未合并提交）→ **停止**，告知用户"分支有未合并提交，确认要删吗？确认后手动 `git branch -D $FEATURE`"。不要自动 -D。

### 8. 输出结果

```
✅ 已本地合并 <FEATURE> 到 <BASE>（--no-ff），并清理分支/worktree。
💡 如需同步远程，请手动执行：git push origin <BASE>
```

## 失败处理

- 测试失败 → 停止，列出失败用例
- diff / commit 不规范 → 提示问题但不强制停止（判断由用户）
- `pull --ff-only` 失败 → 停止，让用户手动 rebase/merge base
- merge 冲突 → 停止，用户解决后重跑
- `worktree remove` 失败 → 停止，用户处理 worktree 内未跟踪文件
- `branch -d` 拒绝 → 停止，用户确认后手动 -D
