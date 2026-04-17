---
name: evolve
description: 本能进化 — 将相关的学习模式聚类为可复用的 Skill
allowed-tools: Read, Write, Bash, Grep, Glob
argument-hint: [可选: 主题关键词]
---

# Evolve

将零散的学习模式聚类整合为结构化 Skill，实现从"经验"到"能力"的进化。

## 何时使用

- `learned/` 目录已积累较多记录（建议 ≥ 5 条同主题）
- 希望把重复出现的模式固化为 skill 以便复用
- 用户明确要求"沉淀 skill"、"整合学习"

## 执行步骤

### 1. 读取学习记录

```bash
TAOZI_DIR="${TAOZI_HOME:-$HOME/.taozi}"
ls "$TAOZI_DIR/learned/"
find "$TAOZI_DIR/learned/" -name "*.md" -o -name "*.json"
```

没有学习记录时，提示用户继续使用一段时间后再来进化。

### 2. 按主题聚类

```
聚类维度:
- 技术领域 (React/Node/SQL/Docker)
- 问题类型 (性能/安全/架构/调试)
- 代码模式 (错误处理/状态管理/数据转换)
- 项目特征 (monorepo/microservice/serverless)
```

如有 `$ARGUMENTS`，优先按指定主题过滤相关记录。

### 3. 生成 Skill 草稿

对每个聚类生成一个 skill 文件：

```markdown
---
name: <skill-name>
description: [一句话描述能力]
triggers:
  - [触发场景 1]
---

# <Skill 标题>

## 来源
由 evolve 从 N 条学习记录中提炼生成。

## 核心知识

### [知识点 1]
- 来源记录: learned/xxx.md, learned/yyy.md
- 关键模式: ...
- 适用场景: ...

## 最佳实践
1. ...

## 反模式（避免）
1. ...

## 相关 Skill
- [相关 skill 名称]
```

### 4. 保存 Skill

保存到项目 `skills/` 目录或 `${TAOZI_HOME:-$HOME/.taozi}/skills/`。

### 5. 报告进化结果

```markdown
## 本能进化报告

### 分析概况
- 学习记录总数 / 识别聚类数 / 生成 Skill 数

### 新生成 Skill

| Skill | 来源记录数 | 关键知识点 |
|-------|-----------|-----------|
| [name] | 5 条 | 知识点1, 知识点2 |

### 进化建议
- 聚类 A 的记录数最多，建议优先打磨
- 聚类 B 只有 2 条记录，继续积累后再进化
```

## 使用示例

```bash
/taozi:evolve                    # 自动聚类所有学习记录
/taozi:evolve React 性能优化     # 按主题过滤后聚类
/taozi:evolve 错误处理模式       # 按问题类型聚类
```
