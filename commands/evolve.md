---
name: taozi:evolve
description: 本能进化 — 将相关的学习模式聚类为可复用的 Skill
allowed-tools: Read, Write, Bash, Grep, Glob
argument-hint: [可选: 主题关键词]
---

# Taozi Instinct Evolve - 本能进化

将零散的学习模式聚类整合为结构化的 Skill，实现从"经验"到"能力"的进化。

## 执行步骤

### 1. 读取学习记录

读取 `~/.claude/taozi/learned/` 目录下的所有学习记录：

```bash
# 检查目录是否存在
ls ~/.claude/taozi/learned/

# 列出所有学习记录文件
find ~/.claude/taozi/learned/ -name "*.md" -o -name "*.json"
```

如果没有学习记录，提示用户：
```
尚未发现学习记录。在日常开发中使用 Taozi 时，系统会自动记录学习到的模式。
继续使用一段时间后再来进化本能吧。
```

### 2. 按主题聚类

分析学习记录的内容，按相关性分组：

```
聚类维度:
- 技术领域 (React/Node/SQL/Docker)
- 问题类型 (性能/安全/架构/调试)
- 代码模式 (错误处理/状态管理/数据转换)
- 项目特征 (monorepo/microservice/serverless)
```

如果有 `$ARGUMENTS`，优先按指定主题过滤相关记录。

### 3. 生成 Skill 草稿

对每个聚类生成一个 Skill 草稿文件：

```markdown
---
name: [skill-name]
description: [一句话描述这个 Skill 的能力]
triggers:
  - [触发场景 1]
  - [触发场景 2]
---

# [Skill 标题]

## 来源
由 evolve 命令从 N 条学习记录中提炼生成。

## 核心知识

### [知识点 1]
- 来源记录: learned/xxx.md, learned/yyy.md
- 关键模式: ...
- 适用场景: ...

### [知识点 2]
- 来源记录: learned/xxx.md
- 关键模式: ...
- 适用场景: ...

## 最佳实践
1. ...
2. ...

## 反模式（避免）
1. ...
2. ...

## 相关 Skill
- [相关 skill 名称]
```

### 4. 保存 Skill

将生成的 Skill 保存到 `skills/` 目录：

```bash
# 保存到项目的 skills 目录
# 或保存到 ~/.claude/taozi/skills/ 目录
```

### 5. 报告进化结果

输出进化报告：

```markdown
## 本能进化报告

### 分析概况
- 学习记录总数: N 条
- 识别聚类: M 组
- 生成 Skill: K 个

### 新生成 Skill
| Skill | 来源记录数 | 关键知识点 |
|-------|-----------|-----------|
| [name] | 5 条 | 知识点1, 知识点2 |

### 进化建议
- 聚类 A 的记录数最多，建议优先打磨这个 Skill
- 聚类 B 只有 2 条记录，继续积累后再进化
- [如有]
```

## 使用示例

```bash
# 自动聚类所有学习记录
/evolve

# 按主题过滤后聚类
/evolve React 性能优化

# 按问题类型聚类
/evolve 错误处理模式
```
