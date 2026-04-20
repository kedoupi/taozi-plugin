---
name: finish
description: 分支收尾 — 功能完成后的强制质检清单，防止漏验证就提 PR。通过后引导用户跑 /taozi:pr 创建 PR。
allowed-tools: Read, Bash, Grep, Glob
argument-hint: [可选：PR 标题或功能描述]
---

# Finish

功能实现完成后，在宣告完成或提 PR 前，按以下清单逐项执行。通用 git 原则见 [git-workflow](../git-workflow/SKILL.md)。

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
grep -rn -E "console\.log|debugger|TODO|FIXME|HACK" \
  --include="*.js" --include="*.ts" \
  --exclude-dir=node_modules --exclude-dir=.git .
```

发现结果时：逐一判断是否合法（合法日志保留，临时 debug 删除）。

### 4. Git Diff 最终确认

先动态检测 base 分支（不要硬编码 `main`）：

```bash
BASE=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
BASE=${BASE:-main}
git fetch origin "$BASE" 2>/dev/null
git diff "origin/$BASE" --stat
git diff "origin/$BASE"
```

逐一审查每个改动文件，确认：
- 没有意外改动无关文件
- 没有遗留临时代码
- 所有改动都属于本次功能

### 5. Commit 规范检查

```bash
git log --oneline "origin/$BASE"..HEAD
```

每条 commit 须符合 `<emoji> <type>: <description>` 格式。emoji / type 对照表见 [git-conventions](../git-conventions/SKILL.md)。

---

## 结论输出规则

- 全部通过 → 输出"**分支收尾检查通过**，可执行 `/taozi:pr` 创建 PR"（PR 描述由 pr skill 专责生成，本 skill 不再重复）
- 任一失败 → 输出"**检查未通过，禁止提 PR**" + 必须修复项列表
