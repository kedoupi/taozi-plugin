# Superpowers 方法论吸收 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新建 `debug`、`finish` 两个 skill，升级 `plan`、`multi-execute`、`verify` 三个 skill，更新 CLAUDE.md 触发规则，并同步 Codex 适配层。

**Architecture:** 所有改动均为 Markdown skill 文件的新建/修改，无运行时代码变更。Task 1-6 完全独立可并行，Task 7（sync-codex）和 Task 8（测试）依赖前六个 Task 完成。

**Tech Stack:** Node.js（sync-codex 脚本）、Markdown（skill 文件）、零依赖测试框架

---

## 文件结构

| 操作 | 文件 | 说明 |
|------|------|------|
| 新建 | `skills/debug/SKILL.md` | 4 阶段系统调试方法论 |
| 新建 | `skills/finish/SKILL.md` | 分支收尾检查清单 |
| 修改 | `skills/plan/SKILL.md` | 重量版：5 阶段设计+实现流程 |
| 修改 | `skills/multi-execute/SKILL.md` | 加入 per-task 双重审查 |
| 修改 | `skills/verify/SKILL.md` | 加入完成门禁声明 |
| 修改 | `CLAUDE.md` | 新增 debug/finish 触发规则 |
| 自动生成 | `.codex/` 适配层 | 由 sync-codex.js 生成，不手动编辑 |

---

## Task 1：新建 `skills/debug/SKILL.md`

**Files:**
- Create: `skills/debug/SKILL.md`

- [ ] **Step 1: 创建目录并写入文件**

```bash
mkdir -p skills/debug
```

写入 `skills/debug/SKILL.md`：

```markdown
---
name: debug
description: 系统调试方法论 — 4 阶段根因分析，禁止无根因 fix
allowed-tools: Read, Bash, Grep, Glob
argument-hint: [问题描述或错误信息]
---

# Debug

**Iron Law：未完成根因调查，禁止提出任何 fix。这条规则没有例外。**

遇到任何 bug、测试失败、意外行为时，按以下 4 个阶段执行。**每个阶段必须完成才能进入下一阶段。**

## Phase 1 — 根因调查

在此阶段禁止提出 fix 建议。

1. **完整读取错误信息**：不跳过 stack trace，记录文件路径、行号、错误码
2. **一致复现**：能稳定复现才能分析；无法复现的问题不能 fix
3. **追溯调用链**：从报错点向上追，找到最原始的失败位置
4. **收集上下文**：读相关文件、查最近改动（`git log --oneline -10`）

输出结论：
- 报错位置：`[文件:行号]`
- 最原始失败点：[描述]
- 相关最近改动：[commit hash + 描述，无则写"无"]

## Phase 2 — 假设形成

1. 列出 2-3 个可能根因，按可能性排序
2. 为每个假设设计最小验证实验
3. 执行验证，确认最终根因，说明选择理由

输出结论：
- 假设 1：[描述] — 可能性：高/中/低 — 验证结果：确认/排除
- 假设 2：[描述] — ...
- **根因确认**：[假设 X]，理由：[...]

## Phase 3 — Fix 实现

- 只针对根因的最小改动，不顺手重构无关代码
- 改动前输出：受影响文件列表、diff 说明、trade-offs

## Phase 4 — 验证

1. 确认 fix 直接覆盖根因（而非绕过症状）
2. 运行相关测试，全部通过
3. 检查改动是否引入新问题

---

## 最容易跳过流程的场景

这些情况下**更要**严格执行 4 个阶段：

- "这个 bug 看起来很简单" — 简单 bug 也有根因，跳过只会多返工
- "时间紧，先试试看" — 系统调试比反复猜测更快，不是更慢
- "试了很多 fix 都没用" — 说明仍在 Phase 1，根因未找到，继续调查
- "之前类似的 bug 是 X 原因" — 相似症状不等于相同根因，重新走 Phase 1
```

- [ ] **Step 2: 确认文件存在**

```bash
cat skills/debug/SKILL.md | head -5
```

预期输出前几行包含 frontmatter `name: debug`。

- [ ] **Step 3: Commit**

```bash
git add skills/debug/SKILL.md
git commit -m "feat(skill): 新增 debug — 4 阶段系统调试方法论"
```

---

## Task 2：新建 `skills/finish/SKILL.md`

**Files:**
- Create: `skills/finish/SKILL.md`

- [ ] **Step 1: 创建目录并写入文件**

```bash
mkdir -p skills/finish
```

写入 `skills/finish/SKILL.md`：

```markdown
---
name: finish
description: 分支收尾 — 功能完成后的强制检查清单，防止漏验证就提 PR
allowed-tools: Read, Bash, Grep, Glob
argument-hint: [可选：PR 标题或功能描述]
---

# Finish

功能实现完成后，在宣告完成或提 PR 前，按以下清单逐项执行。

**门禁：任一项失败，禁止输出"完成"结论，必须修复后重新检查该项。**

## 检查清单

### 1. 全量测试

```bash
node tests/run-all.js
```

预期：所有测试通过，无 skip。

### 2. Lint 检查

```bash
npm run lint 2>/dev/null || echo "无 lint 配置，跳过"
```

### 3. Debug 代码清理

```bash
grep -rn "console\.log\|debugger\|TODO\|FIXME\|HACK" \
  --include="*.js" --include="*.ts" \
  --exclude-dir=node_modules --exclude-dir=.git .
```

发现结果时：逐一判断是否合法（合法日志保留，临时 debug 删除）。

### 4. Git Diff 最终确认

```bash
git diff main --stat
git diff main
```

逐一审查每个改动文件，确认：
- 没有意外改动无关文件
- 没有遗留临时代码
- 所有改动都属于本次功能

### 5. Commit 规范检查

```bash
git log --oneline main..HEAD
```

每条 commit 须符合 Conventional Commits 格式（`feat:`、`fix:`、`chore:` 等）。

### 6. PR 描述输出

所有检查通过后，输出 PR 描述：

```
## 做了什么
[一句话描述]

## 为什么
[背景和动机]

## 测试方式
- [ ] [测试步骤 1]
- [ ] [测试步骤 2]
```

---

## 结论输出规则

- 全部通过 → 输出"**分支收尾检查通过，可以提 PR**"
- 任一失败 → 输出"**检查未通过，禁止提 PR**"+ 必须修复项列表
```

- [ ] **Step 2: 确认文件存在**

```bash
cat skills/finish/SKILL.md | head -5
```

预期前几行包含 frontmatter `name: finish`。

- [ ] **Step 3: Commit**

```bash
git add skills/finish/SKILL.md
git commit -m "feat(skill): 新增 finish — 分支收尾强制检查清单"
```

---

## Task 3：升级 `skills/plan/SKILL.md`（重量版）

**Files:**
- Modify: `skills/plan/SKILL.md`（完整重写）

- [ ] **Step 1: 覆盖写入新版 `skills/plan/SKILL.md`**

```markdown
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

- 读取项目文件结构（`Glob`）、最近 10 条 commits（`git log --oneline -10`）
- 识别与需求相关的模块和文件（`Grep`）
- 确认现有代码约定（命名、结构、测试方式）

输出：简短现状概述（不超过 5 行），不展开细节。

## 阶段 2 — 需求澄清

与用户对话，**一次只问一个问题**，优先给出选项（多选题比开放题更易回答）。

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

全部确认后，将设计文档写入：`docs/specs/YYYY-MM-DD-<topic>.md`

```bash
git add docs/specs/
git commit -m "docs: 添加 <topic> 设计文档"
```

**门禁通过后进入阶段 5。**

## 阶段 5 — 实现计划

按以下格式生成 Bite-sized tasks（每步 2-5 分钟）：

### 任务结构

```markdown
### Task N：[组件名称]

**Files:**
- Create: `exact/path/to/file.js`
- Modify: `exact/path/to/existing.js`

- [ ] **Step 1: 写失败测试**

[实际测试代码，不写"写测试"]

- [ ] **Step 2: 运行确认失败**

\`\`\`bash
node tests/run-all.js
\`\`\`
预期：FAIL，错误信息：[具体预期错误]

- [ ] **Step 3: 最小实现**

[实际代码，不写"实现功能"]

- [ ] **Step 4: 运行确认通过**

\`\`\`bash
node tests/run-all.js
\`\`\`
预期：PASS

- [ ] **Step 5: Commit**

\`\`\`bash
git add [文件列表]
git commit -m "feat: [描述]"
\`\`\`
```

**禁止在任务中写**：TBD、TODO、"类似 Task N"、"实现 X"（无代码）、"添加错误处理"（无具体代码）。

写完后自检：
1. 每个 spec 章节都有对应 task 吗？
2. 有无 placeholder？
3. 后续 task 引用的函数/类型是否在前面 task 中定义？

保存至：`docs/plans/YYYY-MM-DD-<topic>.md`

```bash
git add docs/plans/
git commit -m "docs: 添加 <topic> 实现计划"
```
```

- [ ] **Step 2: 确认写入**

```bash
head -8 skills/plan/SKILL.md
```

预期：frontmatter 中 `description` 包含"重量版 5 阶段"。

- [ ] **Step 3: Commit**

```bash
git add skills/plan/SKILL.md
git commit -m "feat(skill): 升级 plan 为重量版 5 阶段流程"
```

---

## Task 4：升级 `skills/multi-execute/SKILL.md`

**Files:**
- Modify: `skills/multi-execute/SKILL.md`（在步骤 5 后插入双重审查章节）

- [ ] **Step 1: 在「5. 结果收集」和「6. 验证检查」之间插入以下内容**

在 `### 5. 结果收集` 章节结尾、`### 6. 验证检查` 标题之前，插入：

```markdown
### 5.5 Per-Task 双重审查

每个子任务完成后，在进入下一任务前执行两阶段审查。**两阶段都通过才能标记任务为完成。**

#### 审查 A — Spec 合规

对照 `docs/specs/` 中的设计文档，检查：
- 接口签名是否与 spec 定义一致
- 数据结构是否与 spec 定义一致
- 错误处理是否覆盖 spec 列出的边界情况

不通过 → 该 task 的 agent 修复，修复后重新审查 A，不进入审查 B。

#### 审查 B — 代码质量

检查：
- 命名语义清晰，无 dead code
- 测试覆盖该 task 的核心路径
- 无硬编码魔法值
- 与项目现有代码风格一致

不通过 → 修复后重新审查 B，修复完成后标记任务 `[x]`。

```

- [ ] **Step 2: 确认插入位置正确**

```bash
grep -n "5.5\|双重审查\|验证检查" skills/multi-execute/SKILL.md
```

预期：`5.5 Per-Task 双重审查` 出现在 `6. 验证检查` 之前。

- [ ] **Step 3: Commit**

```bash
git add skills/multi-execute/SKILL.md
git commit -m "feat(skill): multi-execute 加入 per-task 双重审查机制"
```

---

## Task 5：升级 `skills/verify/SKILL.md`

**Files:**
- Modify: `skills/verify/SKILL.md`（在文件顶部正文开头插入门禁声明，在输出格式末尾加结论规则）

- [ ] **Step 1: 在「## 何时使用」之前插入门禁声明**

在 `# Verify` 标题行之后、`在结束实现前...` 说明行之前，插入：

```markdown
**完成门禁：验证任一步骤失败时，禁止向用户输出"完成"、"可以提 PR"、"没问题"等结论。必须修复所有 FAIL 项并重新验证通过后，才能声称任务完成。**

```

- [ ] **Step 2: 在「## 输出格式」末尾追加结论规则**

在现有输出格式模板之后追加：

```markdown

### 结论输出规则

- 所有检查项 PASS → 输出"**验证通过，可以继续**"
- 任一检查项 FAIL → 输出"**验证未通过，不能声称完成**"+ 必须修复项列表，禁止附加"整体看起来没问题"等软化语句
```

- [ ] **Step 3: 确认两处修改**

```bash
grep -n "完成门禁\|验证未通过\|验证通过" skills/verify/SKILL.md
```

预期：两处关键词均出现。

- [ ] **Step 4: Commit**

```bash
git add skills/verify/SKILL.md
git commit -m "feat(skill): verify 加入完成门禁，禁止未验证通过就声称完成"
```

---

## Task 6：更新 `CLAUDE.md` 触发规则

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 在触发规则表格中新增两行，并更新 plan 行描述**

找到：
```
| 用户描述新功能需求或任务分解 | `/taozi:plan` |
| 用户准备提交代码或合并 PR | `/taozi:verify` → `/taozi:code-review` |
```

替换为：
```
| 用户描述新功能需求或任务分解 | `/taozi:plan`（重量版：需求澄清 → 设计文档 → 实现计划） |
| 用户准备提交代码或合并 PR | `/taozi:finish` → `/taozi:verify` → `/taozi:code-review` |
| 用户描述 bug / 测试失败 / 意外行为 / "不知道为什么" | `/taozi:debug` |
| 用户说"完成了" / "提 PR" / "可以合并" / "done" | `/taozi:finish` |
```

- [ ] **Step 2: 确认修改**

```bash
grep -A2 -B2 "taozi:debug\|taozi:finish" CLAUDE.md
```

预期：两条新规则均出现在触发表格中。

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "chore: CLAUDE.md 新增 debug/finish 自动触发规则"
```

---

## Task 7：同步 Codex 适配层（依赖 Task 1-6 全部完成）

**Files:**
- Auto-generated: `.codex/` 目录下文件

- [ ] **Step 1: 运行 sync-codex**

```bash
node scripts/sync-codex.js
```

预期：脚本无报错退出，输出包含 `debug`、`finish`、`plan`、`multi-execute`、`verify` 的同步信息。

- [ ] **Step 2: 确认 5 个 skill 均已同步**

```bash
ls .codex/skills/ | grep -E "debug|finish|plan|multi-execute|verify"
```

或查看 `.agents/skills/` 对应路径，确认 5 个 skill 均存在。

- [ ] **Step 3: Commit**

```bash
git add .codex/ .agents/
git commit -m "chore: sync-codex 同步 debug/finish 新增及 plan/multi-execute/verify 升级"
```

---

## Task 8：运行全量测试（依赖 Task 7 完成）

**Files:**（只读，不修改）

- [ ] **Step 1: 运行全量测试**

```bash
node tests/run-all.js
```

预期：所有测试通过，无 FAIL。

- [ ] **Step 2: 如有失败，定位原因**

查看失败的测试文件名和错误信息。常见原因：
- frontmatter 格式问题（嵌套 YAML 会被忽略）
- skill 目录名与 name 字段不一致
- CI 结构检查要求的文件不存在

修复后重新运行 Step 1，直到全部通过。

- [ ] **Step 3: 最终 Commit（如 Step 2 有修复）**

```bash
git add [修复的文件]
git commit -m "fix: 修复测试失败问题"
```

---

## 依赖关系

```
Task 1 ─┐
Task 2 ─┤
Task 3 ─┼─→ Task 7 → Task 8
Task 4 ─┤
Task 5 ─┤
Task 6 ─┘
```

Task 1-6 可并行执行，Task 7 需等待 1-6 全部完成，Task 8 需等待 Task 7 完成。

---

## 验收标准

- [ ] `node tests/run-all.js` 全部通过
- [ ] `npm run lint` 通过（hooks/hooks.json 格式合法）
- [ ] `skills/debug/SKILL.md` 存在，frontmatter `name: debug`
- [ ] `skills/finish/SKILL.md` 存在，frontmatter `name: finish`
- [ ] `skills/plan/SKILL.md` 包含"重量版"/"5 阶段"/"门禁"关键词
- [ ] `skills/multi-execute/SKILL.md` 包含"双重审查"/"Spec 合规"关键词
- [ ] `skills/verify/SKILL.md` 包含"完成门禁"关键词
- [ ] `CLAUDE.md` 触发表格包含 `taozi:debug` 和 `taozi:finish`
- [ ] `.codex/` 适配层已同步（不含旧版内容）
