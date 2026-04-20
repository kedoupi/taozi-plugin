---
name: git-workflow
description: Git 通用行为原则 — 禁止项、分支保护、失败处理。所有 git 操作前的共享约束。
---

# Git Workflow — 通用行为原则

本文件是 Taozi 所有 git 操作的**行为约束单一事实源**。commit / pr / worktree / cleanup 等 skill 继承这些原则，仅在各自文档内保留 1-2 条高频禁止项作为内联提醒。

> 格式规范（emoji、type、分支命名）见 [git-conventions](../git-conventions/SKILL.md)，本文件只管"能做什么、不能做什么"。

## 分支保护

- 不在 `main` / `master` / `develop` 上直接做危险操作（`reset --hard` / `rebase` / `push --force` / 直接 commit）
- 切分支前先确认当前位置（`git branch --show-current`），不确定就问用户
- 需要 base 分支时用 `git symbolic-ref refs/remotes/origin/HEAD` 动态检测，不要硬编码 `main`

## 禁止项

- 禁止 `--no-verify` 跳过 hook，除非用户明确要求
- 禁止 `--force` push 公共分支（`main` / `master` / 其他人也在用的分支）；必要时改用 `--force-with-lease` 并先告知用户
- 禁止 `--amend` 已推送的 commit，除非用户明确要求
- 禁止默认追加 `🤖 Generated with Claude Code` 等 AI footer，除非用户明确要求
- 禁止把无关改动塞进同一 commit
- 禁止 `git branch -D` 前不检查未推送 commit（先 `git log origin/<br>..<br>`）
- 禁止 `git pull ... || true` 这类 `||` 静默吞错

## 失败处理

- 任一 git/gh 命令失败 → **停下来报告原因**，不要自动重试、不要用 `||` 兜底
- pre-commit hook 失败 → 修复底层问题后**新建 commit**（不要 `--amend`，那会修改上一次 commit，丢失 hook 拒绝的差异）
- push 失败 → 不自动加 `--force`，先让用户看失败原因再决定

## 风险操作前确认

以下操作属于"不可逆 / 影响共享状态"，执行前必须先列出操作对象并征得用户确认：

- 删除分支（本地或远程）
- 强推（`--force` / `--force-with-lease`）
- `git reset --hard` / `git clean -fd`
- 删除 worktree
- 修改已推送的 commit（amend / rebase -i / filter-branch）
