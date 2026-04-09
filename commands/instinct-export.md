---
name: instinct-export
description: 导出所有学习本能为 JSON 文件 — 支持团队间共享经验
allowed-tools: Read, Write, Bash, Glob
argument-hint: [导出文件路径，默认 ~/taozi-instincts.json]
---

# Taozi Instinct Export - 本能导出

将所有学习到的本能模式打包为 JSON 文件，支持跨设备同步和团队间共享。

## 执行步骤

### 1. 读取所有学习记录

```bash
# 检查目录
ls ~/.claude/taozi/learned/

# 统计记录数
find ~/.claude/taozi/learned/ -type f | wc -l
```

如果没有学习记录：
```
尚未发现学习记录，无需导出。
继续在日常开发中使用 Taozi，系统会自动积累学习记录。
```

### 2. 解析所有记录

读取 `~/.claude/taozi/learned/` 下的所有文件，提取每条记录的完整信息。

### 3. 打包为 JSON

将所有记录组装为标准 JSON 格式：

```json
{
  "version": "1.0",
  "export_date": "2025-04-07T10:30:00Z",
  "source": "taozi-plugin",
  "stats": {
    "total_count": 15,
    "categories": {
      "前端": 5,
      "后端": 3,
      "数据库": 4,
      "DevOps": 2,
      "安全": 1
    }
  },
  "instincts": [
    {
      "id": "uuid-1",
      "topic": "React 状态管理",
      "category": "前端",
      "pattern": "使用 Zustand 替代 Redux 可减少样板代码...",
      "context": "在项目 X 中实现用户模块时发现...",
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

确定输出路径：
- 如果提供了 `$ARGUMENTS`，使用指定路径
- 否则默认写入 `~/taozi-instincts.json`

```bash
# 写入 JSON 文件
# 确保目标目录存在
mkdir -p "$(dirname "$OUTPUT_PATH")"
```

### 5. 报告导出结果

```markdown
## 本能导出报告

### 导出信息
- 输出文件: ~/taozi-instincts.json
- 文件大小: 12 KB
- 导出记录数: 15 条

### 记录分布
| 类别 | 数量 | 平均置信度 |
|------|------|-----------|
| 前端 | 5 | 82 |
| 后端 | 3 | 75 |
| 数据库 | 4 | 70 |
| DevOps | 2 | 60 |
| 安全 | 1 | 40 |

### 共享方式
1. 直接发送 JSON 文件给团队成员
2. 团队成员运行: /instinct-import ~/taozi-instincts.json
3. 导入后记录会自动降权（置信度 * 70%），需在本地验证后恢复

### 隐私说明
- 导出文件不包含代码内容，只包含学习到的模式和上下文描述
- 如果记录中包含项目敏感信息，请在共享前手动编辑 JSON 文件
```

## 使用示例

```bash
# 导出到默认位置
/instinct-export

# 导出到指定路径
/instinct-export ~/shared/team-instincts.json

# 导出到项目目录
/instinct-export ./docs/team-learning.json
```
