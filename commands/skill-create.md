---
name: skill-create
description: 从描述或代码示例手动创建新的可复用 Skill，补充 /learn 自动提取的盲区
allowed-tools: Read, Write, Bash, Glob
argument-hint: <skill-name> [描述]
---

# 创建新 Skill

从你提供的描述或当前对话中的代码示例，生成一个结构化的 Skill 文件。

## 参数

`$ARGUMENTS`

格式：`<skill-name> [可选：简短描述]`

例：`skill-create redis-patterns Redis 缓存模式与常见陷阱`

## 执行步骤

### 1. 检查是否已存在

```bash
ls ~/.claude/skills/ 2>/dev/null | grep -i "$SKILL_NAME"
ls skills/ 2>/dev/null | grep -i "$SKILL_NAME"
```

如已存在，询问是否覆盖还是补充内容。

### 2. 确认 Skill 内容来源

优先从以下来源提取内容：
- 当前对话中出现的代码示例
- 用户提供的描述
- 项目中已有的相关代码（Glob/Grep 查找）

### 3. 生成 Skill 文件

在 `skills/<skill-name>/SKILL.md` 创建文件，包含：

```markdown
---
name: <skill-name>
description: <一句话描述，用于自动匹配触发>
---

# <Skill 标题>

<2-3 句概述这个 Skill 解决什么问题>

## 核心模式

### 模式 1：<名称>

<适用场景说明>

\`\`\`<language>
// ❌ 反模式
<bad example>

// ✅ 正确做法
<good example>
\`\`\`

<关键点说明>

### 模式 2：<名称>

...

## 常见陷阱

- **陷阱 1**：<描述> → <如何避免>
- **陷阱 2**：<描述> → <如何避免>

## 检查清单

- [ ] <关键点 1>
- [ ] <关键点 2>
- [ ] <关键点 3>

## 相关资源

- 相关 Skill: `<skill-name>`
- 相关 Agent: `<agent-name>`
```

### 4. 验证文件

```bash
cat skills/<skill-name>/SKILL.md
```

### 5. 注册到索引（如有 skills/index.md）

```bash
[ -f skills/index.md ] && echo "- [\`<skill-name>\`](skills/<skill-name>/SKILL.md) — <描述>" >> skills/index.md
```

## 与 /learn 的区别

| | `/learn` | `/skill-create` |
|--|---------|----------------|
| 来源 | 自动从会话提取 | 手动指定内容 |
| 适合 | 重复出现的模式 | 专业领域知识 |
| 触发 | 会话结束时 | 用户主动调用 |

## 注意

- Skill 描述字段非常重要，Claude 靠它来判断是否引用这个 Skill
- 描述要包含触发关键词（如："Redis"、"缓存"、"过期"）
- 代码示例要有 ❌/✅ 对比，让 AI 理解反模式
