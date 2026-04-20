---
name: verify
description: 运行验证循环 — 构建、测试、Lint、类型检查、安全扫描
allowed-tools: Read, Bash, Grep, Glob
argument-hint: [可选：文件路径或目录]
---

# Verify

**完成门禁：验证任一步骤失败时，禁止向用户输出"完成"、"可以提 PR"、"没问题"等结论。必须修复所有 FAIL 项并重新验证通过后，才能声称任务完成。**

在结束实现前给出可信的验证结果，而非主观认为"应该没问题"。目标: `$ARGUMENTS`（默认整个项目）。

## 何时使用

- 改完代码准备结束
- 准备提交、PR 或发布
- 用户要求系统验证构建/测试/lint/风险

## 核心原则

- 任一步失败不中断，继续执行后续步骤
- 报告必须包含所有步骤结果（PASS / FAIL / 未执行）
- 未执行项说明原因和风险
- 覆盖率不达标算 FAIL（默认阈值 80%）
- 指定文件/目录时只验证相关范围

## 执行步骤

### 1. 项目类型检测

```bash
[ -f "tsconfig.json" ] && echo "TypeScript"
[ -f "pyproject.toml" ] || [ -f "setup.py" ] && echo "Python"
[ -f "go.mod" ] && echo "Go"
[ -f "Package.swift" ] || [ -f "*.xcodeproj" ] && echo "Swift"
```

### 2. 构建

```bash
# TypeScript: npx tsc --noEmit
# Python:     python -m py_compile src/main.py
# Go:         go build ./...
# Swift:      xcodebuild build -scheme <scheme> CODE_SIGNING_ALLOWED=NO
```

### 3. 测试

```bash
# TypeScript: npx vitest run --coverage
# Python:     pytest --cov --cov-report=term-missing
# Go:         go test -race -cover ./...
# Swift:      xcodebuild test -scheme <scheme> -enableCodeCoverage YES
```

### 4. Lint

```bash
# TypeScript: npx biome check . (或 eslint)
# Python:     ruff check . && mypy .
# Go:         golangci-lint run ./...
# Swift:      swiftlint lint --strict
```

### 5. 类型检查

```bash
# TypeScript: npx tsc --noEmit
# Python:     mypy --strict .
# Go:         go vet ./...
```

### 6. 安全扫描

```bash
# TypeScript: npm audit --production
# Python:     bandit -r . -f json; pip-audit --strict
# Go:         gosec ./...
# Swift:      检查 Info.plist ATS 配置、硬编码密钥
```

## 输出格式

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

### 总体状态
✅ 全部通过 / ❌ 存在问题需要修复
```

## 结论输出规则

- 所有检查项 PASS → 输出"**验证通过，可以继续**"
- 任一检查项 FAIL → 输出"**验证未通过，不能声称完成**"+ 必须修复项列表，禁止附加"整体看起来没问题"等软化语句
