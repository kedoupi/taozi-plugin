---
name: taozi-git-workflow
description: Taozi Git 工作流。需要创建提交、准备 PR、创建 worktree、清理分支或规范 Git 操作时使用。
---

# Taozi Git Workflow

## 适用场景

- 准备提交当前改动
- 推送分支并创建 PR
- 为大任务创建隔离 worktree
- PR 合并后清理 worktree 和分支

## 基本原则

- 不在 `main` 或 `master` 上直接做危险操作
- 不使用 `--no-verify` 跳过校验，除非用户明确要求
- 提交前先看 diff，必要时拆成多个提交
- 推送前确认分支名、远程和未提交变更

## Commit 规则

- 提交格式: `<emoji> <type>: <description>`
- 标题使用现在时，聚焦意图和结果
- 提交信息不应只是“update”或“fix stuff”

## PR 规则

- 先确认本地分支已推送
- 标题应与提交语义一致
- 正文至少包含 Summary、Changes、Test Plan

## Worktree 规则

- 对大型功能、重构、并行开发优先使用 worktree
- 默认目录使用 `$TAOZI_HOME/worktrees/<repo>/<branch>`
- 如未设置 `TAOZI_HOME`，默认使用 `~/.taozi/worktrees/<repo>/<branch>`

## Cleanup 规则

- 清理前确认 PR 已合并或分支无需保留
- 删除前确认当前不在目标 worktree 内
- 清理操作必须明确说明将删除哪些本地资源
