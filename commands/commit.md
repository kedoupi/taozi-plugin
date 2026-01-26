---
name: taozi:commit
description: 使用 emoji + 约定式格式创建 Git 提交
allowed-tools: Bash(git:*), Read, Grep
---

# Taozi 智能提交

## 当前状态

- 分支: !`git branch --show-current`
- Git 状态: !`git status --porcelain`
- 已暂存: !`git diff --cached --stat`
- 未暂存: !`git diff --stat`

## 提交流程

### 1. 暂存检查

如果没有文件被暂存 (`git diff --cached` 为空)：
- 显示所有变更文件
- 询问用户是否暂存所有变更，或选择特定文件

### 2. 目录上下文检测

检查待提交文件所在目录：
- 目录文件数 >= 3 且无 `CLAUDE.md` → 询问是否创建
- 有 `CLAUDE.md` → 询问是否需要更新

### 3. 分析变更并提交

1. 执行 `git diff --cached` 分析已暂存的更改
2. 判断是否需要拆分为多个提交
3. 使用 **emoji + 约定式提交格式**

## 提交格式

格式: `<emoji> <type>: <description>`

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

**更多 Emoji**:
- 🏷️ 添加类型定义
- 🌐 国际化
- 👔 业务逻辑
- 🚸 UX 改进
- 💥 重大变更
- 🚑️ 紧急热修复
- 🔒️ 安全修复
- 🩹 简单修复
- 💚 修复 CI
- 💡 代码注释
- 💄 UI/样式
- 🚚 移动/重命名
- ⚰️ 删除无用代码
- ➕ 添加依赖
- ➖ 删除依赖
- 🎉 初始提交

## 提交规范

- 使用现在时祈使语气（"添加功能" 而非 "添加了功能"）
- 第一行不超过 72 字符
- 关注 **为什么** 而非 **是什么**
- 永远不要使用 `--no-verify` 跳过 hooks（除非用户明确要求）

## 执行

立即分析变更并创建提交，使用 HEREDOC 格式确保消息正确格式化：

```bash
git commit -m "$(cat <<'EOF'
<emoji> <type>: <description>

<body if needed>
EOF
)"
```
