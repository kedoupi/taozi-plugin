# Superpowers 方法论吸收 — 设计文档

**目标**：将 Superpowers 插件中的核心软件工程方法论吸收进 taozi，新建 2 个 skill、升级 3 个现有 skill、更新 CLAUDE.md 自动触发规则。

**背景**：Superpowers 是流程骨架（AI 工程纪律），taozi 是领域知识库。两者互补，但 taozi 目前缺少强制性的流程约束，导致 AI 容易跳步骤、乱猜 bug、功能做完不验证就声称完成。

---

## 范围

### 新建

| Skill | 来源 | 核心价值 |
|-------|------|---------|
| `debug` | `superpowers:systematic-debugging` | 4 阶段调试，禁止无根因 fix |
| `finish` | `superpowers:finishing-a-development-branch` | 分支收尾检查，防止漏验证就说 done |

### 升级

| Skill | 变化 | 来源 |
|-------|------|------|
| `plan` | 轻量规划 → 完整设计+实现计划（5 阶段重量版） | `superpowers:brainstorming` + `superpowers:writing-plans` |
| `multi-execute` | 无 review → per-task 双重审查 | `superpowers:subagent-driven-development` |
| `verify` | 验证工具 → 强制完成门禁 | `superpowers:verification-before-completion` |

### 配套

- `CLAUDE.md` 新增 `debug` 和 `finish` 的自动触发规则

---

## 新建 Skill：`debug`

### 文件路径
`skills/debug/SKILL.md`

### Frontmatter
```yaml
name: debug
description: 系统调试方法论 — 4 阶段根因分析，禁止无根因 fix
allowed-tools: Read, Bash, Grep, Glob
argument-hint: [问题描述或错误信息]
```

### 核心设计

**Iron Law（写入 skill 正文最顶部，加粗）**：
> 未完成根因调查，禁止提出任何 fix。这条规则没有例外。

**4 个强制阶段**（必须按顺序完成，不可跳过）：

**Phase 1 — 根因调查**
- 完整读取错误信息（包括 stack trace、行号、文件路径）
- 一致复现问题（不能复现 = 不能 fix）
- 追溯调用链，找到最原始的失败点
- 禁止在此阶段提 fix 建议

**Phase 2 — 假设形成**
- 列出 2-3 个可能的根因
- 按可能性排序
- 设计最小验证实验（证伪每个假设）
- 选定最可能的根因，说明理由

**Phase 3 — Fix 实现**
- 只针对根因的最小改动
- 不顺手重构无关代码
- 改动前输出：受影响文件、diff 说明、trade-offs

**Phase 4 — 验证**
- 确认 fix 直接覆盖根因（不是绕过症状）
- 运行测试确认通过
- 检查是否引入新问题

**特别强调场景**（在 skill 中列出，这些情况最容易跳过流程）：
- "这个 bug 看起来很简单" — 简单 bug 也有根因
- "时间紧" — 系统调试比反复猜测更快
- "试了很多 fix 都不行" — 说明还没找到根因，继续 Phase 1

### 触发规则（CLAUDE.md）
场景：用户描述 bug、测试失败、"不知道为什么"、意外行为 → 主动触发 `/taozi:debug`

---

## 新建 Skill：`finish`

### 文件路径
`skills/finish/SKILL.md`

### Frontmatter
```yaml
name: finish
description: 分支收尾 — 功能完成后的强制检查清单，防止漏验证就提 PR
allowed-tools: Read, Bash, Grep, Glob
argument-hint: [可选：PR 标题或功能描述]
```

### 核心设计

**定位**：在用户说"完成了"或"要提 PR"时触发，执行一套强制检查清单，只有全部通过才能宣告完成。

**检查清单（强制顺序，不可跳过）**：

1. **全量测试** — 运行完整测试套件，不能只跑局部
2. **构建验证** — 确认无编译错误
3. **Lint + 类型检查** — 零错误（警告可以有但要记录）
4. **Debug 代码清理** — 搜索并移除 `console.log`、`print`、`debugger`、临时注释
5. **TODO 清点** — 所有 TODO 要么解决，要么转为 issue，不能遗留在本次 PR
6. **Commit 规范检查** — 最近若干 commit 符合 Conventional Commits 格式
7. **Git diff 最终确认** — 用 `git diff main` 审查，确认没有意外改动
8. **PR 描述准备** — 输出模板：做了什么 / 为什么 / 测试方式 / 截图（如适用）

**门禁规则**：任一步骤失败，禁止输出"完成"或"可以提 PR"的结论。必须修复后重新执行失败的步骤。

### 触发规则（CLAUDE.md）
场景：用户说"完成了" / "提 PR" / "可以合并了" / "done" → 主动触发 `/taozi:finish`

---

## 升级 Skill：`plan`（重量版）

### 变化摘要

原版：直接进入需求分析 → 任务拆分，无设计阶段，无门禁。

升级后：完整 5 阶段流程，设计文档用户审批后才能进入实现计划。

### 5 个阶段

**阶段 1 — 上下文探索**（无需用户输入）
- 读取项目文件结构、最近 commits、相关模块
- 识别现有模式和约定（不要引入与项目不一致的新模式）
- 输出：简短的现状概述（不超过 5 行）

**阶段 2 — 需求澄清**（与用户对话）
- 一次只问一个问题
- 优先多选题（比开放题更易回答）
- 目标：理解目的、约束、成功标准
- 何时停止提问：已能描述完整的用户故事 + 边界

**阶段 3 — 方案提议**
- 提出 2-3 个方案
- 每个方案：优点 / 缺点 / 适用场景
- 给出明确推荐，说明理由（不能"都可以"）

**阶段 4 — 设计文档**
- 架构（组件、数据流、集成方式）
- 关键接口定义（函数签名、数据结构）
- 错误处理策略
- 测试策略（测什么、不测什么）
- **门禁**：写完后逐段向用户确认，全部批准后才进入阶段 5
- 保存至：`docs/specs/YYYY-MM-DD-<topic>.md`，git commit

**阶段 5 — 实现计划**
- Bite-sized tasks：每步 2-5 分钟
- 每个 task 包含：受影响文件（精确路径）、具体代码（不写"实现 X"）、测试步骤、commit 命令
- 明确依赖顺序（串行/并行）
- 保存至：`docs/plans/YYYY-MM-DD-<topic>.md`，git commit

### 门禁规则

- 设计文档未获用户批准 → 禁止进入实现计划
- 任务描述含 TBD/TODO/"类似 Task N" → 拦截，必须补全

---

## 升级 Skill：`multi-execute`

### 变化摘要

原版：并行调度 agent，收集结果，无 review 机制。

升级后：每个 task 完成后，经过两阶段强制审查，通过后才标记完成。

### 新增：Per-Task 双重审查

在步骤 5（结果收集）后、步骤 6（验证检查）前，插入：

**审查阶段 A — Spec 合规审查**
- 对照设计文档（`docs/specs/`），检查实现是否符合规格
- 检查点：接口签名、数据结构、错误处理是否与 spec 一致
- 不通过 → 该 task 的 agent 必须修复，不能进入下一 task

**审查阶段 B — 代码质量审查**
- 检查：命名语义、无 dead code、测试覆盖关键路径、无硬编码
- 检查：是否引入了与项目现有模式不一致的新模式
- 不通过 → 修复后重新提交，不能跳过

**标记规则**：只有 A + B 都通过，才在计划中标记该 task 为 `[x]`。

---

## 升级 Skill：`verify`

### 变化摘要

原版：运行验证，输出报告。没有强制"不能说完成"的规则。

升级后：加入硬性完成门禁。

### 新增内容

**在 skill 正文最顶部加入门禁声明**：
> **完成门禁**：验证任一步骤失败时，禁止向用户输出"完成"、"可以提 PR"、"没问题"等结论。必须修复所有 FAIL 项并重新验证通过后，才能声称任务完成。

**验证顺序不变**，但新增：
- 所有步骤跑完后，如果任一 FAIL → 输出"**验证未通过，不能声称完成**"+ 必须修复项列表
- 所有步骤 PASS → 输出"**验证通过，可以继续**"

---

## CLAUDE.md 更新

在「场景自动触发规则」表格新增两行：

| 场景 | 主动触发 |
|------|----------|
| 用户描述 bug / 测试失败 / 意外行为 / "不知道为什么" | `/taozi:debug` |
| 用户说"完成了" / "提 PR" / "可以合并" / "done" | `/taozi:finish` |

同时将「用户描述新功能需求或任务分解」的触发说明更新为：
> 触发 `/taozi:plan`（重量版：需求澄清 → 设计文档 → 实现计划）

---

## 受影响文件

| 文件 | 操作 |
|------|------|
| `skills/debug/SKILL.md` | 新建 |
| `skills/finish/SKILL.md` | 新建 |
| `skills/plan/SKILL.md` | 修改（重量版升级） |
| `skills/multi-execute/SKILL.md` | 修改（加双重审查） |
| `skills/verify/SKILL.md` | 修改（加完成门禁） |
| `CLAUDE.md` | 修改（新增触发规则） |
| `.codex/` 适配层 | 运行 `sync-codex.js` 自动生成 |

---

## 不在范围内

- `receiving-code-review`（方案一决定不做，使用频率低）
- 可视化伴侣（Superpowers brainstorming 的浏览器 mockup 功能）
- `writing-skills`（taozi 已有 `skill-create`）
