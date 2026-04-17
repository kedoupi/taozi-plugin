---
name: instinct-import
description: 从 JSON 文件导入本能 — 合并外部学习记录到本地
allowed-tools: Read, Write, Bash
argument-hint: [JSON 文件路径]
---

# Instinct Import

从 JSON 文件导入外部学习记录，与现有本能合并。

## 何时使用

- 接收团队共享的本能文件
- 从旧设备迁移本能到新设备
- 用户提供 `instinct-export` 产物要求导入

## 执行步骤

### 1. 验证输入文件

```bash
ls "$ARGUMENTS"
cat "$ARGUMENTS" | python3 -m json.tool > /dev/null
```

文件不存在或格式无效时停止并提示正确用法。

### 2. 验证数据结构

```typescript
interface InstinctExport {
  version: string;
  export_date: string;
  source: string;
  instincts: InstinctItem[];
}

interface InstinctItem {
  id: string;
  topic: string;
  category: string;
  pattern: string;
  context: string;
  confidence: number;
  learned_date: string;
  reinforced_count: number;
  source_project: string;
}
```

### 3. 读取现有记录

```bash
TAOZI_DIR="${TAOZI_HOME:-$HOME/.taozi}"
mkdir -p "$TAOZI_DIR/learned/"
ls "$TAOZI_DIR/learned/"
```

### 4. 合并策略

- ID 不存在 → 新增，置信度降为原始值的 70%
- ID 已存在，内容相同 → 跳过
- ID 已存在，内容不同 → 保留两者，本地版本优先
- 主题重复，ID 不同 → 合并到同一主题，提升置信度 +5

### 5. 写入记录

将合并后的记录写入 `$TAOZI_DIR/learned/`。

### 6. 报告导入结果

```markdown
## 本能导入报告

### 文件信息
- 来源文件 / 导出日期 / 来源标识

### 导入结果
- 文件中的记录数 / 新增 / 跳过（已存在）/ 合并（主题重复）/ 失败

### 新增记录

| # | 主题 | 类别 | 置信度 |
|---|------|------|--------|
| 1 | React 性能优化 | 前端 | 56 (原始 80 * 70%) |

### 合并记录

| 主题 | 本地置信度 | 导入置信度 | 合并后 |
|------|-----------|-----------|--------|
| SQL 查询优化 | 85 | 63 | 90 (+5) |

### 后续建议
- 新导入记录置信度较低，在实际项目中验证后可恢复
- 运行 /taozi:instinct-status 查看完整状态
- 验证后的记录可运行 /taozi:evolve 进化为 Skill
```
