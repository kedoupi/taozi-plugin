---
name: continuous-learning
description: 从会话中自动提取可复用模式，构建知识库。会话结束时自动触发评估。
---

# 持续学习系统

自动从每次会话中提取可复用的开发模式，逐步构建个人知识库。

## 学习机制

```
SessionEnd Hook 评估会话
    ↓
写入 ~/.claude/taozi/learned/
    ↓
下次 SessionStart Hook 加载
    ↓
新会话自动引用已学模式
```

## 学到的内容格式

每条学习记录保存在 `~/.claude/taozi/learned/YYYY-MM-DD.json`:

```json
{
  "date": "2025-01-15",
  "timestamp": 1705312800000,
  "hasGitChanges": true,
  "topicHint": "Next.js App Router 数据获取模式",
  "patterns": [
    {
      "problem": "Server Component 中需要客户端交互",
      "solution": "拆分为 Server + Client 组件，Server 获取数据，Client 处理交互",
      "keyPattern": "Server/Client 组件边界",
      "confidence": 0.8
    }
  ]
}
```

### 置信度说明

| 置信度 | 含义 |
|--------|------|
| 0.9+ | 多次验证，可作为默认模式 |
| 0.7-0.9 | 单次验证，可用但需判断 |
| 0.5-0.7 | 初步发现，仅供参考 |

## 手动触发方式

在对话中直接说：
- "总结这次会话的模式"
- "记录这个方案到知识库"
- "/taozi learn"

系统会手动提取当前会话的关键模式并写入学习目录。

## 查看已学到的模式

```bash
# 查看所有学习记录
ls ~/.claude/taozi/learned/

# 查看特定日期的记录
cat ~/.claude/taozi/learned/2025-01-15.json

# 搜索特定主题
grep -r "数据库" ~/.claude/taozi/learned/
```

## 自动清理策略

- 最大条目数: 100 个文件
- 保留天数: 90 天（默认）
- 超出限制时，优先删除最旧、置信度最低的记录
- 清理在每次会话结束时自动执行

## 配置选项

`config.json` 可调整参数:

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `min_session_length` | 5 | 最少对话轮数才触发学习 |
| `auto_extract` | true | 是否自动提取模式 |
| `max_learned_items` | 100 | 最大保存条目数 |
| `ttl_days` | 90 | 记录保留天数 |

## 最佳实践

1. **不要手动编辑**学习记录，让系统自动管理
2. **定期回顾**高置信度模式，确认是否仍然适用
3. **跨项目共享** — 学习目录是全局的，模式会在所有项目中生效
4. **结合思维工具** — 当卡住时，先查看是否已有相关学习记录
