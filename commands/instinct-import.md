---
name: taozi:instinct-import
description: 从 JSON 文件导入本能 — 合并外部学习记录到本地
allowed-tools: Read, Write, Bash
argument-hint: [JSON 文件路径]
---

# Taozi Instinct Import - 本能导入

从 JSON 文件导入外部学习记录，与现有本能合并，支持团队间共享经验。

## 执行步骤

### 1. 验证输入文件

检查用户提供的 JSON 文件：

```bash
# 检查文件是否存在
ls "$ARGUMENTS"

# 检查文件是否为合法 JSON
cat "$ARGUMENTS" | python3 -m json.tool > /dev/null
```

如果文件不存在或格式无效：
```
错误: 文件不存在或 JSON 格式无效。
请提供有效的本能导出文件路径。
用法: /instinct-import /path/to/instincts.json
```

### 2. 验证数据结构

验证 JSON 文件符合预期格式：

```typescript
// 预期的 JSON 结构
interface InstinctExport {
  version: string;           // 导出格式版本
  export_date: string;       // 导出日期
  source: string;            // 来源标识
  instincts: InstinctItem[];
}

interface InstinctItem {
  id: string;                // 唯一标识
  topic: string;             // 主题
  category: string;          // 分类
  pattern: string;           // 学习的模式
  context: string;           // 学习上下文
  confidence: number;        // 原始置信度
  learned_date: string;      // 学习日期
  reinforced_count: number;  // 强化次数
  source_project: string;    // 来源项目
}
```

### 3. 读取现有记录

```bash
# 确保目录存在
mkdir -p ~/.claude/taozi/learned/

# 列出现有记录
ls ~/.claude/taozi/learned/
```

### 4. 合并策略

对每条导入记录执行合并判断：

```
- ID 不存在 → 新增，置信度降为原始值的 70%（新导入，需本地验证）
- ID 已存在，内容相同 → 跳过
- ID 已存在，内容不同 → 保留两者，本地版本优先
- 主题重复，ID 不同 → 合并到同一主题，提升置信度 +5
```

### 5. 写入记录

将合并后的记录写入 `~/.claude/taozi/learned/` 目录。

### 6. 报告导入结果

```markdown
## 本能导入报告

### 文件信息
- 来源文件: /path/to/instincts.json
- 导出日期: 2025-04-01
- 来源标识: team-member-a

### 导入结果
- 文件中的记录数: 15 条
- 新增: 8 条
- 跳过（已存在）: 4 条
- 合并（主题重复）: 3 条
- 失败: 0 条

### 新增记录
| # | 主题 | 类别 | 置信度 |
|---|------|------|--------|
| 1 | React 性能优化 | 前端 | 56 (原始 80 * 70%) |
| 2 | Docker Compose 编排 | DevOps | 49 (原始 70 * 70%) |

### 合并记录
| 主题 | 本地置信度 | 导入置信度 | 合并后 |
|------|-----------|-----------|--------|
| SQL 查询优化 | 85 | 63 | 90 (+5) |

### 后续建议
- 新导入的 8 条记录置信度较低，建议在实际项目中验证
- 运行 /instinct-status 查看完整状态
- 验证后的记录可运行 /evolve 进化为 Skill
```

## 使用示例

```bash
# 导入团队共享的本能文件
/instinct-import ~/Downloads/team-instincts.json

# 导入从其他机器导出的本能
/instinct-import /path/to/my-instincts-backup.json
```
