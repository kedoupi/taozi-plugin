---
name: plan
description: 功能实现计划 — 需求澄清 → 设计文档 → 实现计划（重量版 5 阶段）
allowed-tools: Read, Grep, Glob, Bash, Write
argument-hint: [功能描述]
---

# Plan

根据用户需求 `$ARGUMENTS`，走完整 5 阶段流程：上下文探索 → 需求澄清 → 方案提议 → 设计文档 → 实现计划。

**硬性门禁：设计文档未获用户批准，禁止进入实现计划阶段。**

## 阶段 1 — 上下文探索

无需用户输入，自动执行：

- 用 `Glob` 读取项目文件结构
- 运行 `git log --oneline -10` 查看最近改动
- 用 `Grep` 搜索与需求相关的模块和文件
- 识别现有代码约定（命名、结构、测试方式）

输出：简短现状概述（不超过 5 行），不展开细节。

## 阶段 2 — 需求澄清

与用户对话，**一次只问一个问题**，优先给出多选选项（比开放题更易回答）。

停止条件：能够完整描述用户故事 + 明确功能边界（包含什么/不包含什么）。

## 阶段 3 — 方案提议

提出 2-3 个方案，每个方案包含：

- 核心思路（1-2 句）
- 优点 / 缺点
- 适用场景

给出明确推荐，说明理由。不能"都可以"、"视情况而定"。

等待用户确认方案后再进入阶段 4。

## 阶段 4 — 设计文档

按以下章节逐一呈现，**每个章节呈现后询问用户是否确认**，全部确认后才保存文档：

### 架构

- 主要组件及职责
- 数据流（输入 → 处理 → 输出）
- 与现有代码的集成方式

### 关键接口

- 函数签名、数据结构定义（精确，不写"类似于 X"）
- 模块间通信方式

### 错误处理

- 哪些错误需要处理，怎么处理
- 边界情况列表

### 测试策略

- 测什么（单元/集成/E2E）
- 不测什么（说明理由）

---

全部确认后：

1. 将设计文档写入 `docs/specs/YYYY-MM-DD-<topic>.md`（将日期和主题替换为实际值）
2. Commit：

```bash
git add docs/specs/
git commit -m "docs: 添加 <topic> 设计文档"
```

**门禁通过，进入阶段 5。**

## 阶段 5 — 实现计划

按以下格式生成 Bite-sized tasks（每步 2-5 分钟可完成）：

### 任务结构示例

```
### Task N：[组件名称]

**Files:**
- Create: exact/path/to/file.js
- Modify: exact/path/to/existing.js

- [ ] Step 1: 写失败测试
[实际测试代码]

- [ ] Step 2: 运行确认失败
node tests/run-all.js
预期：FAIL，错误：[具体预期错误]

- [ ] Step 3: 最小实现
[实际代码]

- [ ] Step 4: 运行确认通过
node tests/run-all.js
预期：PASS

- [ ] Step 5: Commit
git add [文件列表]
git commit -m "feat: [描述]"
```

**禁止在任务中写**：TBD、TODO、"类似 Task N"、只写"实现 X"但无代码、"添加错误处理"但无具体代码。

写完后自检：
1. 每个 spec 章节都有对应 task 吗？
2. 有无 placeholder？
3. 后续 task 引用的函数/类型是否在前面 task 中已定义？

保存至 `docs/plans/YYYY-MM-DD-<topic>.md`，然后：

```bash
git add docs/plans/
git commit -m "docs: 添加 <topic> 实现计划"
```
