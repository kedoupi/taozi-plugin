# Git Skills 重设计

**日期**：2026-04-20
**目标**：把 git 相关 skill 从 7 个精简到 4 个，围绕用户真实的两种开发模式重组。

---

## 背景

### 现状

当前 git 相关 skill 共 7 个：

```
git-workflow        ← 通用行为约束（禁止项、分支保护）
git-conventions     ← 格式规范（emoji / type / 分支名）
commit              ← 生成提交信息
pr                  ← 推送 + gh pr create
worktree            ← 创建隔离工作区
cleanup             ← PR 合并后删分支 + worktree
finish              ← 发 PR 前的门禁清单
```

最近一次 commit（`18bc107`）刚把单体 `git-workflow` 拆成了 `commit` / `pr` / `worktree` / `cleanup` 四个独立 skill。

### 问题

对照 Anthropic 官方 [skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)：

1. **skill 数量持续膨胀**。继续按"每个 git 命令一个 skill"切下去会越来越碎。
2. **基础层双规范**。`git-workflow`（约束）+ `git-conventions`（格式）被其他 skill 反复外链，Claude 读 commit 要跳两次才能看全上下文，违反"引用最多一层深"原则。
3. **收尾链条冗余**。`finish` → `verify` → `code-review` → `pr` 四步串联，`finish` 里本身已经跑测试，`verify` 又跑一遍。
4. **PR 路径与用户习惯不符**。用户实际常手动建 PR，`pr` skill 很少用到；但流程设计把它当必经步骤。
5. **`cleanup` 入口模糊**。靠 `CLAUDE.md` 的"场景自动触发"提醒，PR 合并后容易忘。

### 用户实际使用模式

通过澄清，用户的真实节奏是两种：

**模式 A：完整 Git Flow**（偶尔，想要规范）
- 拉 worktree / 建分支
- 多次 commit
- 完工后：本地 merge 回主分支 + 清理

**模式 B：日常快撸**（主要模式，高频）
- 在主分支或随手分支上改
- 改完一块 → commit
- 结束

**关键洞察**：
- `commit` 是两种模式共用的核心，必须保留且单独存在
- PR 用户手动做，不强制纳入流程
- `worktree` 只在模式 A 用，可选
- `finish` 不需要 4 选 1，直接默认"本地 merge + 清理"即可

---

## 设计决策

### 决策 1：从 7 个 skill 精简到 4 个

```
保留 + 重构：
├── git-conventions   ← 规范源（合并 git-workflow 的禁止项）
├── commit            ⭐ 日常主力（轻微精简）
├── worktree          ← 模式 A 开工（外链调整）
└── finish            ← 模式 A 收尾（重写：本地 merge + 清理）

删除：
├── git-workflow      → 合并到 git-conventions
├── pr                → 用户手动 git push && gh pr create
└── cleanup           → 合并到 finish 的清理步骤
```

### 决策 2：`finish` 默认行为 = 本地 merge (--no-ff) + 清理

不再做 4 选 1 交互，直接走默认路径。想发 PR 的用户手动推送，不走 finish。

```
/taozi:finish
  1. 前置检查：当前不在 main/master/develop
  2. 测试验证：node tests/run-all.js（失败则停）
  3. diff 最终审查 + commit 规范检查
  4. 切回 base：git checkout <base> && git pull --ff-only
  5. 合并：git merge --no-ff <feature-branch>
  6. 删除 feature 分支
  7. 如果在 worktree：git worktree remove
  8. 输出：提醒用户手动 git push origin <base>（不自动推）
```

**不自动 `git push origin main`** —— 保持保守，用户自己决定推送时机。

### 决策 3：PR 不做 skill

想发 PR 的用户执行：
```bash
git push -u origin <branch>
gh pr create
```
不再包装成 skill。`commit` 里的 message 格式已经足够让 `gh pr create` 自动拿来做 PR 标题。

### 决策 4：`git-workflow` 合并进 `git-conventions`

两个文件都是"被引用的规范"，合成一个。合并后其他 skill 只需要外链 `git-conventions` 一处。

---

## 每个 skill 的骨架

### 1. `git-conventions`（合并版）

**frontmatter**：
```yaml
name: git-conventions
description: Git 提交规范与行为约束 — emoji/type 对照、分支命名、禁止项、失败处理。被 commit/worktree/finish 引用，用户不直接调用。
```

**章节**：
1. 提交格式（现有）
2. Emoji 类型表（现有）
3. 分支命名（现有）
4. 提交规范（现有：祈使语气、72 字符、why not what）
5. **行为约束**（从 git-workflow 迁入）
   - 分支保护
   - 禁止项（--no-verify / --force / --amend 已推送 / AI footer / 无关改动 / `||` 吞错）
   - 失败处理
   - 风险操作确认

### 2. `commit`（轻微精简）

**frontmatter**：保持不变。

**改动**：
- 删除第 9 行"emoji 表与分支命名见 git-conventions skill"→ 改成更简短的 "完整规范见 [git-conventions](../git-conventions/SKILL.md)"
- 删除第 66-67 行"完整 git 禁止原则见 git-workflow" —— 合并后直接在上面的引用里覆盖

正文结构保持现状（步骤 1-5：收集状态 → 暂存 → 分析 → 生成 → 执行）。

### 3. `worktree`（外链调整）

**改动**：
- 第 9 行 `见 [git-workflow]` → 改成 `见 [git-conventions]`
- 第 18 行 `参见 [git-conventions]` → 保持
- 第 38 行 `/taozi:cleanup` 的提示 → 改成 `方便 /taozi:finish 识别并删除`

### 4. `finish`（重写）

**frontmatter**：
```yaml
name: finish
description: 分支收尾 — 跑测试 → 本地 merge (--no-ff) → 删分支/worktree。默认不推送 main，想发 PR 请手动 git push。
allowed-tools: Read, Bash, Grep, Glob
```

**正文结构**：

```markdown
# Finish

功能完成后的一键收尾：测试 → 本地合并 → 清理。通用 git 约束见 [git-conventions](../git-conventions/SKILL.md)。

**门禁：前置检查或测试失败 → 禁止执行合并步骤，必须修复后重跑。**

## 前置检查

1. 当前分支不在 main/master/develop（否则停止）
2. 工作区干净（git status --porcelain 为空）
3. 动态检测 base 分支：git symbolic-ref refs/remotes/origin/HEAD

## 执行步骤

### 1. 测试验证
node tests/run-all.js  （失败则停）

### 2. Diff 最终审查
git diff origin/$BASE --stat → 逐文件确认无意外改动

### 3. Commit 规范检查
git log --oneline origin/$BASE..HEAD → 每条须符合 <emoji> <type>: <desc>

### 4. 切回 base + 同步
git checkout $BASE
git pull --ff-only origin $BASE

### 5. 合并（--no-ff）
git merge --no-ff <feature-branch>

### 6. 删除 feature 分支
git branch -d <feature-branch>
（若有未合并提交会拒绝，此时必须用户确认才 -D）

### 7. 清理 worktree（如适用）
检测 git worktree list，若 feature 在 worktree 中：
  cd $(git rev-parse --show-toplevel)
  git worktree remove <worktree-path>

### 8. 完成输出
"✅ 已本地合并到 <base>。如需同步远程，请手动执行：git push origin <base>"

## 失败处理
- 测试失败 → 停止，列出失败用例
- merge 冲突 → 停止，提示用户手动解决后再跑
- branch -d 拒绝 → 提示有未合并提交，让用户确认是否 -D
```

---

## 删除/迁移清单

| 文件 | 动作 | 去向 |
|---|---|---|
| `skills/git-workflow/SKILL.md` | 删除 | 内容合并到 `skills/git-conventions/SKILL.md` |
| `skills/pr/SKILL.md` | 删除 | 无（用户手动 git push && gh pr create） |
| `skills/cleanup/SKILL.md` | 删除 | 清理逻辑合并到 `skills/finish/SKILL.md` 的步骤 6-7 |

## 附带改动

1. **`CLAUDE.md`**：场景自动触发表需更新
   - 删除"`/taozi:pr`"、"`/taozi:cleanup`"的触发条目
   - "完成"触发改为：`/taozi:finish`（单步）而非 `/taozi:finish → /taozi:verify → /taozi:code-review → /taozi:pr` 四步链
2. **`scripts/sync-codex.js`**：自动同步，无需手动改动
3. **CI 结构检查**（`.github/workflows/test.yml`）：
   - `skills/*/SKILL.md` 存在性检查会移除已删除的条目
   - 需确认 CI 脚本是否硬编码了 skill 路径（如果是则需更新）

---

## 对用户流程的影响

### 模式 B（日常，高频）：无影响
```
改代码 → /taozi:commit → 改代码 → /taozi:commit → ...
```

### 模式 A（正式功能）：更顺
```
改动前：
/taozi:worktree → commit × N → /taozi:finish → /taozi:verify → /taozi:code-review → /taozi:pr

改动后：
/taozi:worktree → /taozi:commit × N → /taozi:finish
                                        （内部：测试 → merge --no-ff → 清理）
                                        （想 PR 手动: git push && gh pr create）
```

步骤从 6 步变成 3 步。PR 变成可选手动动作。

---

## 风险与不做的事

### 暂不覆盖（YAGNI）
下面这些场景在当前设计中**不加 skill**，未来确认成为痛点再补：

- rebase / merge 冲突解决
- `git commit --amend` / fixup
- cherry-pick
- revert
- stash

用户遇到时继续手动处理或用 Claude 裸 git 命令。

### 已评估但保留不动的 skill（非 git 范畴）

- `verify`：通用构建/测试/lint/安全验证，不只用于 git 流程
- `code-review`：通用代码审查，不只用于 PR 前

这两个 skill 保留，但**不再**作为 git 流程的必经步骤串联。用户主动调用即可。

---

## 验收标准

1. `skills/` 目录下：git-workflow / pr / cleanup 已删除
2. `skills/git-conventions/SKILL.md` 包含原 `git-workflow` 的所有约束条目
3. `skills/finish/SKILL.md` 跑通完整路径：测试通过 → --no-ff 合并 → 删分支 → 删 worktree（如有）
4. `skills/commit/SKILL.md` 和 `skills/worktree/SKILL.md` 的外链只指向 `git-conventions`
5. `node tests/run-all.js` 全绿
6. `node scripts/sync-codex.js` 同步后 `.codex/agents/`、`.agents/skills/` 与源码一致
7. `CLAUDE.md` 的场景触发表已更新
8. CHANGELOG.md 新增 breaking change 条目 + 迁移对照表
