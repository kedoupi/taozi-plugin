---
name: quality-gate
description: 发布前质量门禁 — 构建、测试、lint、安全、覆盖率全部通过才放行
allowed-tools: Read, Bash, Grep, Glob
argument-hint: [可选：目标环境 staging|production]
---

# Quality Gate

发布前最后防线。所有检查项必须通过，否则阻止发布并给出修复指引。目标环境: `$ARGUMENTS`（默认 staging）。

## 何时使用

- 上线前、交付前、发布阻断判断
- 用户明确要求做"发布前检查"

## 放行原则

- 任一关键检查失败，不应放行
- 缺少验证证据时，结论为 `FAIL` 或 `CONDITIONAL PASS`
- 不能用主观判断替代测试或构建结果

## 执行顺序

### Gate 1：构建检查

```bash
if [ -f "package.json" ]; then npm run build 2>&1 | tail -20
elif [ -f "go.mod" ]; then go build ./... 2>&1
elif [ -f "pom.xml" ]; then mvn package -DskipTests -q 2>&1 | tail -20
elif [ -f "Cargo.toml" ]; then cargo build --release 2>&1 | tail -20
fi
```

**通过标准**：exit code = 0，无 ERROR

### Gate 2：测试检查

```bash
if [ -f "package.json" ]; then npm test -- --coverage --passWithNoTests 2>&1 | tail -30
elif [ -f "go.mod" ]; then go test ./... -cover 2>&1
elif [ -f "pom.xml" ]; then mvn test -q 2>&1 | tail -20
fi
```

**通过标准**：0 failures；覆盖率 ≥ 70%（staging）/ ≥ 80%（production）

### Gate 3：Lint 检查

```bash
if [ -f "package.json" ]; then npx eslint src/ --max-warnings=0 2>&1 | tail -20
elif [ -f "go.mod" ]; then golangci-lint run 2>&1 | tail -20
elif [ -f "pyproject.toml" ]; then ruff check . 2>&1 | tail -20
fi
```

**通过标准**：0 errors，warnings ≤ 5

### Gate 4：安全扫描

```bash
# 密钥检测
grep -rnE '(api_key|secret|password|token)\s*=\s*["\x27][^"\x27]{8,}' \
  --exclude-dir=node_modules --exclude-dir=.git \
  --include='*.ts' --include='*.js' --include='*.py' --include='*.go' . | wc -l

# 依赖漏洞
[ -f "package.json" ] && npm audit --audit-level=high 2>&1 | tail -5
```

**通过标准**：无硬编码密钥，无高危依赖漏洞

### Gate 5：类型检查（如适用）

```bash
[ -f "tsconfig.json" ] && npx tsc --noEmit 2>&1 | tail -20
[ -f "pyproject.toml" ] && mypy src/ --ignore-missing-imports 2>&1 | tail -10
```

**通过标准**：0 type errors

## 报告格式

```markdown
## 质量门禁报告

**目标环境**: [staging/production]
**总体结论**: ✅ PASS / ⚠️ CONDITIONAL PASS / ❌ FAIL

| Gate | 检查项 | 状态 | 详情 |
|------|--------|------|------|
| 1 | 构建 | ✅/❌ | — |
| 2 | 测试 | ✅/❌ | 覆盖率: X% |
| 3 | Lint | ✅/❌ | X errors, Y warnings |
| 4 | 安全 | ✅/❌ | X 高危问题 |
| 5 | 类型 | ✅/❌ | X errors |

### 阻止原因（如有）
1. [具体问题] → 推荐修复路径
```

## 快速修复路径

| 失败 Gate | 推荐 skill |
|---------|---------|
| 构建失败 | `/taozi:build-fix` |
| 测试失败 | `/taozi:tdd` |
| Lint 错误 | `/taozi:code-review` |
| 安全问题 | `/taozi:security-scan` |
| 类型错误 | 使用 `typescript-reviewer` agent |
