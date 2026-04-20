# Git Skills 重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 git 相关 skill 从 7 个精简到 4 个（git-conventions / commit / worktree / finish），围绕用户真实的两种开发模式重组。

**Architecture:** 合并 git-workflow 到 git-conventions（单一规范源）；删除 pr 和 cleanup（用户手动）；重写 finish 为默认"本地 merge --no-ff + 清理"。其他语言/通用 skill（verify / code-review）保持不变。

**Tech Stack:** Markdown（SKILL.md + frontmatter），Node.js 同步脚本，Git。

**Spec:** `docs/superpowers/specs/2026-04-20-git-skills-redesign-design.md`

---

## File Structure

**删除**（目录整体移除）：
- `skills/git-workflow/` — 合并到 git-conventions
- `skills/pr/` — 用户手动 `git push && gh pr create`
- `skills/cleanup/` — 清理逻辑并入 finish

**修改**：
- `skills/git-conventions/SKILL.md` — 追加"行为约束"章节（吸收 git-workflow）
- `skills/commit/SKILL.md` — 移除 git-workflow 外链
- `skills/worktree/SKILL.md` — 外链指向 git-conventions，移除 cleanup 引用
- `skills/finish/SKILL.md` — 完全重写（本地 merge + 清理）
- `CLAUDE.md` — 更新"场景自动触发"表第 101 + 107 行
- `CHANGELOG.md` — 新增 breaking change 条目

**生成**（自动）：
- `.codex/` / `.agents/` 下对应文件由 `scripts/sync-codex.js` 自动同步

---

## Task 1: 合并 git-workflow 到 git-conventions

**Files:**
- Modify: `skills/git-conventions/SKILL.md`
- Delete: `skills/git-workflow/` (整目录)

- [ ] **Step 1: 在 git-conventions 末尾追加"行为约束"章节**

编辑 `skills/git-conventions/SKILL.md`，在文件末尾（现有"提交规范"章节之后）追加：

```markdown

## 行为约束

本节是 Taozi 所有 git 操作的**行为约束单一事实源**。commit / worktree / finish 等 skill 继承这些原则。

### 分支保护

- 不在 `main` / `master` / `develop` 上直接做危险操作（`reset --hard` / `rebase` / `push --force` / 直接 commit）
- 切分支前先确认当前位置（`git branch --show-current`），不确定就问用户
- 需要 base 分支时用 `git symbolic-ref refs/remotes/origin/HEAD` 动态检测，不要硬编码 `main`

### 禁止项

- 禁止 `--no-verify` 跳过 hook，除非用户明确要求
- 禁止 `--force` push 公共分支（`main` / `master` / 其他人也在用的分支）；必要时改用 `--force-with-lease` 并先告知用户
- 禁止 `--amend` 已推送的 commit，除非用户明确要求
- 禁止默认追加 `🤖 Generated with Claude Code` 等 AI footer，除非用户明确要求
- 禁止把无关改动塞进同一 commit
- 禁止 `git branch -D` 前不检查未推送 commit（先 `git log origin/<br>..<br>`）
- 禁止 `git pull ... || true` 这类 `||` 静默吞错

### 失败处理

- 任一 git/gh 命令失败 → **停下来报告原因**，不要自动重试、不要用 `||` 兜底
- pre-commit hook 失败 → 修复底层问题后**新建 commit**（不要 `--amend`，那会修改上一次 commit，丢失 hook 拒绝的差异）
- push 失败 → 不自动加 `--force`，先让用户看失败原因再决定

### 风险操作前确认

以下操作属于"不可逆 / 影响共享状态"，执行前必须先列出操作对象并征得用户确认：

- 删除分支（本地或远程）
- 强推（`--force` / `--force-with-lease`）
- `git reset --hard` / `git clean -fd`
- 删除 worktree
- 修改已推送的 commit（amend / rebase -i / filter-branch）
```

- [ ] **Step 2: 删除 skills/git-workflow/ 整个目录**

```bash
rm -rf skills/git-workflow
```

- [ ] **Step 3: 验证 git-conventions 无语法错误**

```bash
node -e "
const fs = require('fs');
const content = fs.readFileSync('skills/git-conventions/SKILL.md', 'utf8');
const match = content.match(/^---\n([\s\S]*?)\n---/);
if (!match) { console.error('FAIL: frontmatter missing'); process.exit(1); }
console.log('OK: frontmatter present');
console.log('length:', content.split('\n').length, 'lines');
"
```

Expected: `OK: frontmatter present` + line count around 110。

- [ ] **Step 4: 提交**

```bash
git add skills/git-conventions/SKILL.md skills/git-workflow
git commit -m "$(cat <<'EOF'
♻️ refactor(skills): 合并 git-workflow 到 git-conventions

把行为约束（禁止项、失败处理、风险操作确认）合并进 git-conventions，作为 git 操作的单一规范源。删除独立的 git-workflow skill，减少跨 skill 跳转。

BREAKING CHANGE: 删除 skills/git-workflow/，其他 skill 的外链需同步更新。
EOF
)"
```

---

## Task 2: commit skill 精简外链

**Files:**
- Modify: `skills/commit/SKILL.md`

- [ ] **Step 1: 精简第 9 行外链描述**

把 `skills/commit/SKILL.md` 第 9 行：

```markdown
生成符合 Taozi 规范的 git commit。emoji 表与分支命名见 [`git-conventions`](../git-conventions/SKILL.md) skill。
```

改成：

```markdown
生成符合 Taozi 规范的 git commit。完整规范（emoji/type/分支名/行为约束）见 [git-conventions](../git-conventions/SKILL.md)。
```

- [ ] **Step 2: 删除 git-workflow 外链（原第 66-67 行）**

把 `skills/commit/SKILL.md` 末尾的 "禁止（commit 专属）" 章节下方：

```markdown
## 禁止（commit 专属）

- 禁止 `--no-verify` 跳过 hook
- 禁止把无关改动塞进同一个 commit

> 完整 git 禁止原则（--force、--amend 已推送、AI footer、`||` 吞错等）见 [git-workflow](../git-workflow/SKILL.md)。
```

改成（删掉最后的引用行，因为 git-workflow 已并入 conventions，文件顶部已引用过）：

```markdown
## 禁止（commit 专属）

- 禁止 `--no-verify` 跳过 hook
- 禁止把无关改动塞进同一个 commit
```

- [ ] **Step 3: 验证 commit skill 不再引用 git-workflow**

```bash
grep -n "git-workflow" skills/commit/SKILL.md && echo "FAIL: 仍有 git-workflow 引用" || echo "OK: 清理完成"
```

Expected: `OK: 清理完成`

- [ ] **Step 4: 提交**

```bash
git add skills/commit/SKILL.md
git commit -m "$(cat <<'EOF'
♻️ refactor(commit): 移除 git-workflow 外链

git-workflow 已并入 git-conventions，commit skill 只保留一个外链到 conventions。
EOF
)"
```

---

## Task 3: worktree skill 调整外链

**Files:**
- Modify: `skills/worktree/SKILL.md`

- [ ] **Step 1: 替换第 9 行的 git-workflow 外链**

把 `skills/worktree/SKILL.md` 第 9 行：

```markdown
为隔离工作创建 git worktree。通用 git 禁止原则见 [git-workflow](../git-workflow/SKILL.md)。
```

改成：

```markdown
为隔离工作创建 git worktree。通用 git 约束见 [git-conventions](../git-conventions/SKILL.md)。
```

- [ ] **Step 2: 修改第 38 行的 cleanup 引用**

把第 38 行：

```markdown
> 路径约定：`$TAOZI_HOME/worktrees/<repo>/<branch>`，方便 `/taozi:cleanup` 找到并删除。
```

改成：

```markdown
> 路径约定：`$TAOZI_HOME/worktrees/<repo>/<branch>`，方便 `/taozi:finish` 识别并清理。
```

- [ ] **Step 3: 验证 worktree skill 无失效外链**

```bash
grep -n -E "git-workflow|taozi:cleanup" skills/worktree/SKILL.md && echo "FAIL: 仍有失效引用" || echo "OK: 清理完成"
```

Expected: `OK: 清理完成`

- [ ] **Step 4: 提交**

```bash
git add skills/worktree/SKILL.md
git commit -m "$(cat <<'EOF'
♻️ refactor(worktree): 外链指向 git-conventions，清理失效的 cleanup 引用

git-workflow 已合并入 git-conventions；cleanup skill 已删除（清理逻辑并入 finish）。
EOF
)"
```

---

## Task 4: 重写 finish skill

**Files:**
- Modify: `skills/finish/SKILL.md`（整文件替换）

- [ ] **Step 1: 完全替换 finish SKILL.md 内容**

用下面的完整内容覆盖 `skills/finish/SKILL.md`：

````markdown
---
name: finish
description: 分支收尾 — 跑测试 → 本地 merge (--no-ff) → 删分支/worktree。默认不推送 main，想发 PR 请手动 git push。
allowed-tools: Read, Bash, Grep, Glob
---

# Finish

功能完成后的一键收尾：**测试验证 → 本地合并到 base → 清理分支和 worktree**。通用 git 约束见 [git-conventions](../git-conventions/SKILL.md)。

**门禁：前置检查或测试失败 → 禁止执行合并步骤，必须修复后重跑。**

## 何时使用

- 在 feature 分支上开发完成，想本地合并回主分支
- **不想**走 PR 流程（走 PR 的话手动 `git push && gh pr create`，不要用 finish）

## 前置检查

### 1. 当前分支不在保护分支

```bash
CURRENT=$(git branch --show-current)
case "$CURRENT" in
  main|master|develop) echo "FAIL: 当前在保护分支 $CURRENT，禁止 finish"; exit 1 ;;
esac
```

### 2. 工作区干净

```bash
if [ -n "$(git status --porcelain)" ]; then
  echo "FAIL: 工作区有未提交改动，先 commit 或 stash"; exit 1
fi
```

### 3. 动态检测 base 分支

```bash
BASE=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
BASE=${BASE:-main}
```

## 执行步骤

### 1. 全量测试

```bash
node tests/run-all.js
```

失败则停止，列出失败用例。

### 2. Diff 最终审查

```bash
git fetch origin "$BASE" 2>/dev/null
git diff "origin/$BASE" --stat
```

逐文件确认：无意外改动、无遗留临时代码、无无关文件。

### 3. Commit 规范检查

```bash
git log --oneline "origin/$BASE"..HEAD
```

每条须符合 `<emoji> <type>: <description>` 格式（emoji 表见 [git-conventions](../git-conventions/SKILL.md)）。

### 4. 切回 base 并同步

```bash
FEATURE="$CURRENT"
git checkout "$BASE"
git pull --ff-only origin "$BASE"
```

若 `pull --ff-only` 失败 → base 有新改动但无法快进，停止，让用户手动解决。

### 5. 合并（--no-ff）

```bash
git merge --no-ff "$FEATURE" -m "Merge branch '$FEATURE'"
```

若冲突 → 停止，让用户手动解决冲突后重跑。

### 6. 删除 feature 分支

```bash
git branch -d "$FEATURE"
```

若 `-d` 拒绝（有未合并提交）→ **停止**，告知用户"分支有未合并提交，确认要删吗？确认后手动 `git branch -D $FEATURE`"。不要自动 -D。

### 7. 清理 worktree（如适用）

```bash
WT_PATH=$(git worktree list --porcelain | awk -v b="$FEATURE" '
  /^worktree /{wt=$2}
  /^branch / && $2=="refs/heads/"b {print wt}
')
if [ -n "$WT_PATH" ]; then
  git worktree remove "$WT_PATH"
fi
```

### 8. 输出结果

```
✅ 已本地合并 <FEATURE> 到 <BASE>（--no-ff），并清理分支/worktree。
💡 如需同步远程，请手动执行：git push origin <BASE>
```

## 失败处理

- 测试失败 → 停止，列出失败用例
- diff / commit 不规范 → 提示问题但不强制停止（判断由用户）
- `pull --ff-only` 失败 → 停止，让用户手动 rebase/merge base
- merge 冲突 → 停止，用户解决后重跑
- `branch -d` 拒绝 → 停止，用户确认后手动 -D
````

- [ ] **Step 2: 验证 finish skill 格式合法**

```bash
node -e "
const fs = require('fs');
const content = fs.readFileSync('skills/finish/SKILL.md', 'utf8');
const match = content.match(/^---\n([\s\S]*?)\n---/);
if (!match) { console.error('FAIL: frontmatter missing'); process.exit(1); }
if (!match[1].includes('name: finish')) { console.error('FAIL: name field wrong'); process.exit(1); }
if (content.includes('git-workflow')) { console.error('FAIL: 仍引用 git-workflow'); process.exit(1); }
if (content.includes('/taozi:pr') || content.includes('/taozi:cleanup')) { console.error('FAIL: 仍引用已删除的 skill'); process.exit(1); }
console.log('OK: finish skill 格式正确');
console.log('length:', content.split('\n').length, 'lines');
"
```

Expected: `OK: finish skill 格式正确`

- [ ] **Step 3: 提交**

```bash
git add skills/finish/SKILL.md
git commit -m "$(cat <<'EOF'
♻️ refactor(finish): 重写为本地 merge + 清理一体化

改变默认行为：finish 不再引导用户去 /taozi:pr，而是直接执行"测试 → merge --no-ff → 删分支 → 清理 worktree"。想发 PR 的用户手动 git push && gh pr create。

BREAKING CHANGE: finish 默认行为从"门禁清单"变为"一键收尾（本地合并）"。
EOF
)"
```

---

## Task 5: 删除 pr 和 cleanup skill

**Files:**
- Delete: `skills/pr/` (整目录)
- Delete: `skills/cleanup/` (整目录)

- [ ] **Step 1: 删除两个 skill 目录**

```bash
rm -rf skills/pr skills/cleanup
```

- [ ] **Step 2: 确认删除成功**

```bash
ls skills/ | grep -E "^(pr|cleanup)$" && echo "FAIL: 仍存在" || echo "OK: 已删除"
```

Expected: `OK: 已删除`

- [ ] **Step 3: 提交**

```bash
git add -A skills/
git commit -m "$(cat <<'EOF'
♻️ refactor(skills): 删除 pr 和 cleanup skill

用户手动 git push && gh pr create 更符合实际节奏；cleanup 逻辑已并入 finish 的步骤 6-7。

BREAKING CHANGE: /taozi:pr 和 /taozi:cleanup 不再可用。
EOF
)"
```

---

## Task 6: 更新 CLAUDE.md 场景自动触发表

**Files:**
- Modify: `CLAUDE.md:101` and `CLAUDE.md:107`

- [ ] **Step 1: 修改第 101 行**

把 `CLAUDE.md` 第 101 行：

```markdown
| 用户准备提交代码或合并 PR | `/taozi:finish` → `/taozi:verify` → `/taozi:code-review` → `/taozi:pr` |
```

改成：

```markdown
| 用户准备提交代码 | `/taozi:commit`（日常）或 `/taozi:finish`（本地合并收尾） |
```

- [ ] **Step 2: 修改第 107 行**

把 `CLAUDE.md` 第 107 行：

```markdown
| 用户说"完成了" / "提 PR" / "可以合并" / "done" | `/taozi:finish` → `/taozi:verify` → `/taozi:code-review` → `/taozi:pr` |
```

改成：

```markdown
| 用户说"完成了" / "本地合并" / "done" | `/taozi:finish`（走完整收尾） |
| 用户说"提 PR" / "推远程" | 提醒手动 `git push && gh pr create`（不再有 pr skill） |
```

- [ ] **Step 3: 验证无残留引用**

```bash
grep -n -E "taozi:pr|taozi:cleanup" CLAUDE.md && echo "FAIL: 仍有引用" || echo "OK"
```

Expected: `OK`

- [ ] **Step 4: 提交**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
📝 docs(claude): 更新场景自动触发表，移除已删除 skill 的引用

- 删除 /taozi:pr 和 /taozi:cleanup 的触发条目
- 完成触发改为 /taozi:finish 单步（不再四步串联）
EOF
)"
```

---

## Task 7: 同步 Codex 适配层

**Files:**
- Regenerate: `.codex/` and `.agents/` (由脚本处理)

- [ ] **Step 1: 运行 sync-codex.js**

```bash
node scripts/sync-codex.js
```

Expected: 脚本打印同步结果，无错误。

- [ ] **Step 2: 检查 .agents/ 和 .codex/ 里已删除的 skill 是否已同步移除**

```bash
ls .agents/skills/ 2>/dev/null | grep -E "^(git-workflow|pr|cleanup)$" && echo "FAIL: 仍存在" || echo "OK: 已清理"
```

Expected: `OK: 已清理`

- [ ] **Step 3: 检查 manifest 更新**

```bash
grep -E "git-workflow|cleanup|^\s*\"pr\":" .agents/.taozi-sync-skills.json && echo "FAIL: manifest 仍有残留" || echo "OK: manifest 已更新"
```

Expected: `OK: manifest 已更新`

- [ ] **Step 4: 提交**

```bash
git add .codex/ .agents/
git commit -m "$(cat <<'EOF'
🔧 chore(sync-codex): 同步 git skill 重构到 Codex 适配层

运行 node scripts/sync-codex.js 同步：删除 git-workflow/pr/cleanup，更新 commit/worktree/finish，合并后 git-conventions。
EOF
)"
```

---

## Task 8: 更新 CHANGELOG.md

**Files:**
- Modify: `CHANGELOG.md`（在顶部添加新条目）

- [ ] **Step 1: 在 CHANGELOG.md 开头（`# Changelog` 之后）追加新条目**

读取当前 CHANGELOG.md 的前 20 行确认格式，然后在 `# Changelog` 下方插入：

```markdown

## [Unreleased]

### ⚠️ Breaking Changes

Git skill 从 7 个精简到 4 个，围绕两种真实开发模式重组。

**删除的 skill**：

| 删除 | 替代方案 |
|---|---|
| `/taozi:git-workflow` | 内容已合并到 `/taozi:git-conventions` |
| `/taozi:pr` | 手动 `git push && gh pr create` |
| `/taozi:cleanup` | 并入 `/taozi:finish` 的清理步骤 |

**行为变更**：

- `/taozi:finish` 默认行为改为"本地 merge --no-ff + 删分支 + 清理 worktree"。不再引导用户去 `/taozi:pr`。想发 PR 请手动 `git push && gh pr create`。
- `CLAUDE.md` 的"完成"场景触发从四步链 `finish → verify → code-review → pr` 变为单步 `finish`。

**迁移指南**：

- 日常提交：继续用 `/taozi:commit`（无变化）
- 完成功能想本地合并：用 `/taozi:finish`（新行为）
- 完成功能想发 PR：手动 `git push -u origin <branch> && gh pr create`
- 开 worktree：继续用 `/taozi:worktree`（无变化）

### ♻️ Refactoring

- `skills/git-conventions/SKILL.md`：追加"行为约束"章节（合并自 git-workflow）
- `skills/commit/SKILL.md`：精简外链，只引用 git-conventions
- `skills/worktree/SKILL.md`：外链更新，移除 cleanup 引用
- `skills/finish/SKILL.md`：完全重写为一键收尾
```

- [ ] **Step 2: 提交**

```bash
git add CHANGELOG.md
git commit -m "$(cat <<'EOF'
📝 docs(changelog): 记录 git skill 重构的 breaking changes 与迁移指南
EOF
)"
```

---

## Task 9: 最终验证

**Files:** 无修改，仅运行验证命令。

- [ ] **Step 1: 运行全量测试**

```bash
node tests/run-all.js
```

Expected: 所有测试通过，无失败。

- [ ] **Step 2: 运行 lint**

```bash
npm run lint
```

Expected: hooks.json 格式合法，无错误。

- [ ] **Step 3: 确认 skill 目录最终状态**

```bash
ls skills/ | grep -E "^(git-workflow|pr|cleanup)$" && echo "FAIL: 未清理干净" || echo "OK: 已删除"
ls skills/ | grep -E "^(git-conventions|commit|worktree|finish)$" | wc -l
```

Expected: `OK: 已删除` + 输出 `4`

- [ ] **Step 4: 确认 .codex 和 .agents 也已同步**

```bash
ls .agents/skills/ 2>/dev/null | grep -E "^(git-workflow|pr|cleanup)$" && echo "FAIL" || echo "OK: .agents 已清理"
ls .codex/ 2>/dev/null && echo "OK: .codex 存在"
```

Expected: `OK: .agents 已清理`

- [ ] **Step 5: 列出全部 commit**

```bash
git log --oneline origin/main..HEAD
```

Expected: 8 条 commit（Task 1-8 各一条）。

- [ ] **Step 6: 报告完成**

输出：

```
✅ Git skills 重构完成：
   - 7 个 skill → 4 个（git-conventions / commit / worktree / finish）
   - 删除 git-workflow / pr / cleanup
   - finish 默认行为改为本地 merge + 清理
   - CLAUDE.md 场景表 + CHANGELOG 已更新
   - 全量测试 + lint 通过
   - Codex 适配层已同步

💡 下一步（用户手动）：
   - 如需发版：运行 /release 升 MAJOR（breaking change）
   - 如需推远程：git push origin main
```
