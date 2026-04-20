---
name: git-conventions
description: Git 提交规范和工作流最佳实践。提交代码、创建分支时使用。
---

# Git 规范

## 提交格式

```
<emoji> <type>: <description>
```

## Emoji 类型表

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

## 更多 Emoji

- 🏷️ 类型定义
- 🌐 国际化
- 💥 重大变更
- 🚑️ 紧急修复
- 🔒️ 安全修复
- 💄 UI/样式
- 🚚 移动/重命名
- ➕ 添加依赖
- ➖ 删除依赖
- 🎉 初始提交

## 分支命名

- `feat/<description>` - 新功能
- `fix/<description>` - Bug 修复
- `refactor/<description>` - 重构
- `docs/<description>` - 文档
- `chore/<description>` - 杂项

## 提交规范

- 使用现在时祈使语气
- 第一行不超过 72 字符
- 关注 **为什么** 而非 **是什么**
- 永不使用 `--no-verify`

## 行为约束

本节是 Taozi 所有 git 操作的**行为约束单一事实源**。commit / worktree / finish 等 skill 继承这些原则。

### 分支保护

- 不在 `main` / `master` / `develop` 上直接做危险操作（`reset --hard` / `rebase` / `push --force` / 直接 commit）
- 切分支前先确认当前位置（`git branch --show-current`），不确定就问用户
- 需要 base 分支时用 `git symbolic-ref refs/remotes/origin/HEAD` 动态检测，不要硬编码 `main`

### 禁止项

- 禁止 `--no-verify` 跳过 hook，除非用户明确要求
- 禁止 `--force` push 公共分支（`main` / `master` / 其他人也在用的分支）；必要时改用 `--force-with-lease` 并先告知用户
- 禁止 `--amend` 已推送的 commit，除非用户明确要求
- 禁止默认追加 `🤖 Generated with Claude Code` 等 AI footer，除非用户明确要求
- 禁止把无关改动塞进同一 commit
- 禁止 `git branch -D` 前不检查未推送 commit（先 `git log origin/<br>..<br>`）
- 禁止 `git pull ... || true` 这类 `||` 静默吞错

### 失败处理

- 任一 git/gh 命令失败 → **停下来报告原因**，不要自动重试、不要用 `||` 兜底
- pre-commit hook 失败 → 修复底层问题后**新建 commit**（不要 `--amend`，那会修改上一次 commit，丢失 hook 拒绝的差异）
- push 失败 → 不自动加 `--force`，先让用户看失败原因再决定

### 风险操作前确认

以下操作属于"不可逆 / 影响共享状态"，执行前必须先列出操作对象并征得用户确认：

- 删除分支（本地或远程）
- 强推（`--force` / `--force-with-lease`）
- `git reset --hard` / `git clean -fd`
- 删除 worktree
- 修改已推送的 commit（amend / rebase -i / filter-branch）
