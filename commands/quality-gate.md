---
name: quality-gate
description: 发布前质量门禁 — 构建、测试、lint、安全、覆盖率全部通过才放行
allowed-tools: Read, Bash, Grep, Glob
argument-hint: [可选：目标环境 staging|production]
---

# 质量门禁

发布前的最后防线。所有检查项必须通过，否则阻止发布并给出修复指引。

## 目标环境

`$ARGUMENTS`（默认：staging）

## 执行顺序

### Gate 1：构建检查

```bash
# 检测项目类型并执行对应构建
if [ -f "package.json" ]; then
  npm run build 2>&1 | tail -20
elif [ -f "go.mod" ]; then
  go build ./... 2>&1
elif [ -f "pom.xml" ]; then
  mvn package -DskipTests -q 2>&1 | tail -20
elif [ -f "Cargo.toml" ]; then
  cargo build --release 2>&1 | tail -20
fi
```

**通过标准**：构建 exit code = 0，无 ERROR 级别输出

---

### Gate 2：测试检查

```bash
# 运行测试套件
if [ -f "package.json" ]; then
  npm test -- --coverage --passWithNoTests 2>&1 | tail -30
elif [ -f "go.mod" ]; then
  go test ./... -cover 2>&1
elif [ -f "pom.xml" ]; then
  mvn test -q 2>&1 | tail -20
fi
```

**通过标准**：
- 所有测试通过（0 failures）
- 覆盖率 ≥ 70%（staging），≥ 80%（production）

---

### Gate 3：Lint 检查

```bash
if [ -f "package.json" ]; then
  npx eslint src/ --max-warnings=0 2>&1 | tail -20
elif [ -f "go.mod" ]; then
  golangci-lint run 2>&1 | tail -20
elif [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
  ruff check . 2>&1 | tail -20
fi
```

**通过标准**：0 errors，warnings ≤ 5

---

### Gate 4：安全扫描（简化版）

```bash
# 密钥检测
echo "=== 密钥检测 ==="
SECRET_COUNT=$(grep -rn \
  -E '(api_key|secret|password|token)\s*=\s*["\x27][^"\x27]{8,}' \
  --exclude-dir=node_modules --exclude-dir=.git \
  --include='*.ts' --include='*.js' --include='*.py' --include='*.go' . \
  2>/dev/null | wc -l)
echo "潜在硬编码密钥: $SECRET_COUNT 处"

# 依赖漏洞
echo "=== 依赖漏洞 ==="
[ -f "package.json" ] && npm audit --audit-level=high 2>&1 | tail -5
```

**通过标准**：无硬编码密钥，无高危依赖漏洞

---

### Gate 5：类型检查（如适用）

```bash
[ -f "tsconfig.json" ] && npx tsc --noEmit 2>&1 | tail -20
[ -f "pyproject.toml" ] && mypy src/ --ignore-missing-imports 2>&1 | tail -10
```

**通过标准**：0 type errors

---

## 报告格式

```markdown
## 质量门禁报告

**时间**: $(date)
**目标环境**: [staging/production]
**总体结论**: ✅ 放行 / ❌ 阻止发布

---

| Gate | 检查项 | 状态 | 详情 |
|------|--------|------|------|
| 1 | 构建 | ✅/❌ | — |
| 2 | 测试 | ✅/❌ | 覆盖率: X% |
| 3 | Lint | ✅/❌ | X errors, Y warnings |
| 4 | 安全 | ✅/❌ | X 个高危问题 |
| 5 | 类型 | ✅/❌ | X type errors |

---

### 阻止原因（如有）
1. [具体问题] → 建议用 `/build-fix` 或 `/tdd` 修复

### 放行条件
所有 Gate 为 ✅ 时，可以执行 `/pr` 或部署流程
```

## 快速修复指引

| 失败 Gate | 推荐命令 |
|---------|---------|
| 构建失败 | `/build-fix` |
| 测试失败 | `/tdd` |
| Lint 错误 | `/cleanup` |
| 安全问题 | `/security-scan` |
| 类型错误 | 使用 `typescript-reviewer` agent |
