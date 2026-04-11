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
