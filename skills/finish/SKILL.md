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
