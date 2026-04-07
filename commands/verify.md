---
name: verify
description: 运行验证循环 — 构建、测试、Lint、类型检查、安全扫描
allowed-tools: Read, Bash, Grep, Glob
argument-hint: [可选：文件路径或目录]
---

# 验证循环

对当前项目或指定文件运行完整的验证流程。

## 参数

目标: `$ARGUMENTS`（默认整个项目）

## 执行步骤

### 1. 项目类型检测

自动检测项目类型：

```bash
# 检测标记文件
[ -f "tsconfig.json" ] && echo "TypeScript"
[ -f "pyproject.toml" ] || [ -f "setup.py" ] && echo "Python"
[ -f "go.mod" ] && echo "Go"
[ -f "Package.swift" ] || [ -f "*.xcodeproj" ] && echo "Swift"
```

### 2. 构建

```bash
# TypeScript
npx tsc --noEmit                    # 类型检查即构建验证

# Python
python -m py_compile src/main.py    # 语法检查

# Go
go build ./...

# Swift
xcodebuild build -scheme <scheme> CODE_SIGNING_ALLOWED=NO
```

**构建结果**: PASS / FAIL（附错误信息）

### 3. 测试

```bash
# TypeScript
npx vitest run --coverage           # 或 npx jest --coverage

# Python
pytest --cov --cov-report=term-missing

# Go
go test -race -cover ./...

# Swift
xcodebuild test -scheme <scheme> -enableCodeCoverage YES
```

**测试结果**: PASS / FAIL（附失败测试列表 + 覆盖率）

### 4. Lint

```bash
# TypeScript
npx biome check .                   # 或 npx eslint .

# Python
ruff check . && mypy .

# Go
golangci-lint run ./...

# Swift
swiftlint lint --strict
```

**Lint 结果**: PASS / FAIL（附警告和错误列表）

### 5. 类型检查

```bash
# TypeScript
npx tsc --noEmit

# Python
mypy --strict .

# Go
go vet ./...

# Swift（编译时自动检查）
xcodebuild build -scheme <scheme> CODE_SIGNING_ALLOWED=NO
```

**类型检查结果**: PASS / FAIL（附类型错误列表）

### 6. 安全扫描

```bash
# TypeScript
npm audit --production

# Python
bandit -r . -f json
pip-audit --strict

# Go
gosec ./...

# Swift
# 检查 Info.plist 中的 ATS 配置
# 检查是否有硬编码密钥
```

**安全扫描结果**: PASS / FAIL（附漏洞列表）

## 报告格式

```markdown
## 验证报告

| 检查项 | 状态 | 详情 |
|--------|------|------|
| 构建   | PASS/FAIL | [错误摘要] |
| 测试   | PASS/FAIL | 通过/总计, 覆盖率 X% |
| Lint   | PASS/FAIL | 错误 X, 警告 Y |
| 类型检查 | PASS/FAIL | 错误 X |
| 安全扫描 | PASS/FAIL | 漏洞 X |

### 需要修复的问题
1. [问题描述] — `文件:行号`
2. ...

### 总体状态
✅ 全部通过 / ❌ 存在问题需要修复
```

## 重要原则

- 任何一步失败不中断，继续执行后续步骤
- 报告必须包含所有步骤的结果
- 如果指定了文件/目录，只验证相关范围
- 覆盖率不达标算 FAIL（阈值: 80%）
