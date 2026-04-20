---
name: pr
description: 推送当前分支并通过 gh CLI 创建 PR。包含主分支保护、未提交变更检查、base 分支自动检测。
allowed-tools: Bash(git:*), Bash(gh:*), Read
---

# PR

把当前分支推送到远程并创建 Pull Request。通用 git 禁止原则见 [git-workflow](../git-workflow/SKILL.md)。

## 前置检查（顺序执行，任一失败则停止）

### 1. 主分支保护

```bash
git branch --show-current
```

若结果为 `main` / `master` / `develop` → **停止**，告知用户先切到功能分支。

### 2. 未提交变更

```bash
git status --porcelain
```

非空 → 询问用户：先 `/taozi:commit` 处理还是先 `git stash`？不要替用户决定。

### 3. base 分支检测

```bash
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'
```

无输出时回退顺序：`main` → `master` → 询问用户。

### 4. 与 base 同步

```bash
git fetch origin <base>
git log HEAD..origin/<base> --oneline
```

有输出 = base 有新 commit，建议先 rebase 或 merge 再创建 PR。

## 推送

```bash
git push -u origin "$(git branch --show-current)"
```

push 失败时**不要自动加 `--force`**，先报告原因等用户决定。

## 创建 PR

收集上下文：

```bash
git log origin/<base>..HEAD --oneline
git diff origin/<base>...HEAD --stat
```

基于以上信息生成标题与正文。emoji + type 对照见 [git-conventions](../git-conventions/SKILL.md)。

- **标题**：与 commit 风格一致（`<emoji> <type>: <description>`），≤ 70 字符
- **正文**：必含 Summary / Changes / Test Plan 三段

```bash
gh pr create --base <base> --title "<emoji> <type>: <description>" --body "$(cat <<'EOF'
## Summary
- <1-3 条变更摘要>

## Changes
- <具体变更>

## Test Plan
- [ ] <验证步骤>
EOF
)"
```

## 禁止（pr 专属）

- 禁止对 `main` / `master` 强推
- 禁止默认追加 `🤖 Generated with Claude Code` 等 AI footer，除非用户明确要求

> 完整 git 禁止原则（--no-verify、--amend 已推送 commit、`||` 吞错等）见 [git-workflow](../git-workflow/SKILL.md)。
