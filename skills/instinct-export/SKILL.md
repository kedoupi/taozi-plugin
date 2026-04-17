---
name: instinct-export
description: 导出所有学习本能为 JSON 文件 — 支持团队间共享经验
allowed-tools: Read, Write, Bash, Glob
argument-hint: [导出文件路径，默认 ~/taozi-instincts.json]
---

# Instinct Export

将所有学习到的本能模式打包为 JSON 文件，支持跨设备同步和团队间共享。

## 何时使用

- 换机或备份前导出本能
- 分享给团队成员 / 在团队间复用经验
- 用户要求"导出本能"、"备份学习记录"

## 执行步骤

### 1. 读取所有学习记录

```bash
TAOZI_DIR="${TAOZI_HOME:-$HOME/.taozi}"
ls "$TAOZI_DIR/learned/"
find "$TAOZI_DIR/learned/" -type f | wc -l
```

如果没有学习记录，告知用户并停止。

### 2. 解析所有记录

读取 `$TAOZI_DIR/learned/` 下所有文件，提取完整信息。

### 3. 打包为 JSON

```json
{
  "version": "1.0",
  "export_date": "YYYY-MM-DDTHH:MM:SSZ",
  "source": "taozi-plugin",
  "stats": {
    "total_count": 15,
    "categories": { "前端": 5, "后端": 3, "数据库": 4 }
  },
  "instincts": [
    {
      "id": "uuid-1",
      "topic": "React 状态管理",
      "category": "前端",
      "pattern": "使用 Zustand 替代 Redux 可减少样板代码...",
      "context": "在项目 X 中...",
      "confidence": 90,
      "learned_date": "2025-01-15",
      "last_reinforced": "2025-04-03",
      "reinforced_count": 5,
      "source_project": "project-x"
    }
  ]
}
```

### 4. 写入文件

- 指定路径优先（`$ARGUMENTS`）
- 否则默认 `~/taozi-instincts.json`

### 5. 报告导出结果

```markdown
## 本能导出报告

### 导出信息
- 输出文件 / 文件大小 / 导出记录数

### 记录分布

| 类别 | 数量 | 平均置信度 |
|------|------|-----------|
| 前端 | 5 | 82 |

### 共享方式
1. 发送 JSON 文件给团队成员
2. 对方运行 /taozi:instinct-import ~/taozi-instincts.json
3. 导入后记录自动降权（置信度 * 70%），需本地验证后恢复

### 隐私说明
- 导出文件不包含代码内容，只包含模式和上下文描述
- 记录含敏感信息时请在共享前手动编辑 JSON
```
