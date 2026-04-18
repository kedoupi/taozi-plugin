---
name: skill-create
description: 从描述或代码示例手动创建新的可复用 Skill，补充 /taozi:learn 自动提取的盲区
allowed-tools: Read, Write, Bash, Glob
argument-hint: <skill-name> [描述]
---

# Skill Create

从你提供的描述或当前对话中的代码示例，生成一个结构化的 Skill 文件。

## 何时使用

- 对话中已沉淀专业领域知识，想手动固化为 skill
- 已有明确 skill 名和目标能力，需要生成骨架
- 用户明确要求"创建 skill"、"skill 模板"

## 参数格式

`$ARGUMENTS` = `<skill-name> [简短描述]`

例: `skill-create redis-patterns Redis 缓存模式与常见陷阱`

## 执行步骤

### 1. 检查是否已存在

```bash
ls skills/ 2>/dev/null | grep -i "$SKILL_NAME"
ls ~/.claude/skills/ 2>/dev/null | grep -i "$SKILL_NAME"
```

已存在时询问是覆盖还是补充内容。

### 2. 确认 Skill 内容来源

- 当前对话中的代码示例
- 用户提供的描述
- 项目中已有的相关代码（Glob/Grep 查找）

### 3. 生成 Skill 文件

创建 `skills/<skill-name>/SKILL.md`：

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

## 检查清单

- [ ] <关键点 1>

## 相关资源

- 相关 Skill: `<skill-name>`
- 相关 Agent: `<agent-name>`
```

### 4. 验证文件

```bash
cat skills/<skill-name>/SKILL.md
```

### 5. 运行测试（frontmatter 格式验证）

```bash
node tests/run-all.js
```

必须全绿才算完成。测试会自动验证新 skill 的 frontmatter `name`/`description` 字段是否存在且格式合法。若报错，检查 frontmatter 是否有嵌套 YAML 或缺失必填字段。

### 6. 同步 Codex 适配层

```bash
node scripts/sync-codex.js
```

新 skill 必须 sync 后才能在 Codex 侧生效。

## 与 `/taozi:learn` 的区别

| | `/taozi:learn` | `/taozi:skill-create` |
|--|---------|----------------|
| 来源 | 自动从会话提取 | 手动指定内容 |
| 适合 | 重复出现的模式 | 专业领域知识 |
| 触发 | 会话结束时 | 用户主动调用 |

## 注意

- `description` 字段非常重要，Claude 靠它判断是否引用
- 描述要包含触发关键词（如 "Redis"、"缓存"、"过期"）
- 代码示例要有 ❌/✅ 对比，让 AI 理解反模式
