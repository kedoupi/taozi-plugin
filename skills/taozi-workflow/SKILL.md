---
name: taozi-workflow
description: 完整的 Git 开发工作流，包含 worktree 隔离开发、GitHub PR 强制流程、智能提交（emoji + 约定式）。在开始改代码、涉及 Git 操作、GitHub 仓库相关操作时自动触发。
---

# Taozi Git 工作流

## 触发条件

在以下情况自动触发此工作流：
- 用户要求修改代码时
- 涉及 Git 操作时
- GitHub 仓库相关操作时

## 工作流程

### 阶段 1：开发前检查

在开始任何代码修改前，执行以下检查：

```bash
# 1. 检查是否在 Git 仓库
git rev-parse --git-dir

# 2. 获取当前分支
git branch --show-current

# 3. 检查未提交的更改
git status --porcelain

# 4. 检查是否是 GitHub 仓库
git remote -v | grep -i github
```

**检查规则**：
- 如果在 `main` 或 `master` 分支，**警告用户**不要直接在主分支开发
- 如果有未提交的更改，**询问用户**如何处理（提交/暂存/放弃）
- 如果是 GitHub 仓库，**强制走 PR 流程**

### 阶段 2：询问开发模式

在开始修改代码前，询问用户：

> "是否使用 worktree 隔离开发？"
> - **是**：在 `~/.claude-worktree/<repo>/<branch>` 创建独立工作目录
> - **否**：直接在当前目录创建分支开发

**建议使用 worktree 的场景**：
- 需要保持主分支代码不变
- 并行开发多个功能
- 大型重构任务

**不需要 worktree 的场景**：
- 简单的 bug 修复
- 小型功能迭代
- 用户明确要求直接开发

### 阶段 3：Worktree 流程（用户选择使用时）

```bash
# 1. 获取仓库名称
REPO_NAME=$(basename $(git rev-parse --show-toplevel))

# 2. 创建 worktree 目录
WORKTREE_PATH="$HOME/.claude-worktree/$REPO_NAME/<branch-name>"
mkdir -p $(dirname $WORKTREE_PATH)

# 3. 创建 worktree + 分支
git worktree add $WORKTREE_PATH -b <branch-name>

# 4. 切换到 worktree 目录
cd $WORKTREE_PATH

# 5. 安装依赖（Node.js 项目）
if [ -f "pnpm-lock.yaml" ]; then
    pnpm install
elif [ -f "yarn.lock" ]; then
    yarn install
elif [ -f "package-lock.json" ]; then
    npm install
fi
```

**分支命名规范**：
- `feat/<description>` - 新功能
- `fix/<description>` - Bug 修复
- `refactor/<description>` - 重构
- `docs/<description>` - 文档
- `chore/<description>` - 杂项

### 阶段 4：提交流程

#### 4.1 预提交检查（可选）

除非用户指定 `--no-verify`，否则运行：
- `pnpm lint` 或 `npm run lint`（如果存在）
- `pnpm build` 或 `npm run build`（如果存在）
- `pnpm test` 或 `npm run test`（如果存在）

#### 4.2 目录上下文检测

检查待提交文件所在目录的 `CLAUDE.md` 状态：
- 目录文件数 ≥3 且无 `CLAUDE.md` → 提示是否创建
- 有 `CLAUDE.md` → 询问是否需要更新

#### 4.3 暂存文件

```bash
# 1. 查看状态，确认要添加的文件
git status --porcelain

# 2. 如果没有文件被暂存，则暂存所有变更
if [ -z "$(git diff --cached --name-only)" ]; then
    echo "没有文件被暂存，自动添加变更..."
    git add .
fi
```

**重要**：永远不要盲目使用 `git add -A`，先 `git status` 确认

#### 4.4 分析并创建提交

1. 执行 `git diff --cached` 分析更改
2. 判断是否需要拆分为多个提交
3. 使用 **emoji + 约定式提交格式**

**提交格式**：`<emoji> <type>: <description>`

**Emoji 映射**：
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

**更多 Emoji**：
- 🏷️ feat: 添加类型定义
- 🌐 feat: 国际化
- 👔 feat: 业务逻辑
- 🚸 feat: UX 改进
- 💥 feat: 重大变更
- 🚑️ fix: 紧急热修复
- 🔒️ fix: 安全修复
- 🩹 fix: 简单修复
- 💚 fix: 修复 CI
- 💡 docs: 代码注释
- 💄 style: UI/样式
- 🚚 refactor: 移动/重命名
- ⚰️ refactor: 删除无用代码
- ➕ chore: 添加依赖
- ➖ chore: 删除依赖
- 🎉 chore: 初始提交

**提交消息规范**：
- 使用现在时祈使语气（"添加功能" 而非 "添加了功能"）
- 第一行不超过 72 字符
- 关注 **为什么** 而非 **是什么**

### 阶段 5：PR 流程（GitHub 仓库强制）

**核心规则**：GitHub 仓库禁止直接 push 到 main/master

```bash
# 1. Push 到远程分支
git push -u origin <branch-name>

# 2. 创建 PR
gh pr create --title "<pr-title>" --body "$(cat <<'EOF'
## Summary
<变更摘要>

## Changes
- <具体变更 1>
- <具体变更 2>

## Test Plan
- [ ] <测试项 1>
- [ ] <测试项 2>
EOF
)"
```

**PR 标题格式**：与提交消息一致，使用 emoji + 约定式

### 阶段 6：PR 合并后清理

当 PR 合并后，执行清理流程：

```bash
# 1. 如果使用了 worktree，先切回原目录
cd <original-directory>

# 2. 切换到 main 并更新
git checkout main
git pull origin main

# 3. 删除 worktree（如果使用了）
git worktree remove ~/.claude-worktree/$REPO_NAME/<branch-name>

# 4. 删除本地分支
git branch -d <branch-name>

# 5. 清理远程已删除的分支引用
git fetch --prune
```

## 重要规则

### 禁止操作
- ❌ 直接 push 到 main/master（GitHub 仓库）
- ❌ 使用 `git push --force`（除非用户明确要求）
- ❌ 使用 `--no-verify` 跳过 hooks（除非用户明确要求）
- ❌ 盲目 `git add -A`

### 必须操作
- ✅ 改代码前询问是否使用 worktree
- ✅ GitHub 仓库强制走 PR
- ✅ 提交前检查 `git status`
- ✅ PR 合并后更新本地 main
- ✅ 使用规范的提交消息格式

## 示例

### 完整工作流示例

```
用户：帮我给这个项目添加一个登录功能

助手：
1. [检查] 当前在 main 分支，检测到是 GitHub 仓库
2. [询问] 是否使用 worktree 隔离开发？
   用户选择：是
3. [Worktree] 创建 ~/.claude-worktree/my-app/feat-login
4. [开发] 在 worktree 中完成登录功能
5. [提交] ✨ feat: add user login with JWT authentication
6. [PR] 创建 PR，等待 review
7. [清理] PR 合并后，更新 main，删除 worktree 和分支
```

### 提交消息示例

```
✨ feat: add user authentication system
🐛 fix: resolve memory leak in WebSocket handler
📝 docs: update API documentation
♻️ refactor: simplify error handling logic
🔒️ fix: strengthen password requirements
⚡️ perf: optimize database query performance
```
