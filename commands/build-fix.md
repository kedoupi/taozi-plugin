---
name: build-fix
description: 修复构建错误 — TypeScript 类型错误、编译失败、依赖问题
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
argument-hint: [可选：错误信息]
---

# 构建修复

诊断并修复构建错误。错误来源: `$ARGUMENTS`（可选）或自动检测。

## 执行步骤

### 1. 错误采集

如果 `$ARGUMENTS` 提供了错误信息，直接使用。否则自动检测：

```bash
# TypeScript
npx tsc --noEmit 2>&1

# Python
python -m py_compile . 2>&1
mypy --no-error-summary . 2>&1

# Go
go build ./... 2>&1

# Swift
xcodebuild build 2>&1 | grep "error:"
```

### 2. 错误分析

对每个错误进行分析：

```markdown
## 错误分析

### 错误 1: [错误摘要]
- 文件: `path/to/file.ts:行号`
- 错误码: TS2345（如果有）
- 原因: [根因分析]
- 修复方案: [最小修复]
- 影响范围: [是否影响其他文件]
```

常见错误分类：

| 类型 | 常见原因 | 修复策略 |
|------|----------|----------|
| 类型错误 | 类型不匹配、缺少属性 | 添加正确的类型定义 |
| 导入错误 | 路径错误、模块不存在 | 修正导入路径 |
| 依赖缺失 | 包未安装或版本不匹配 | 安装/更新依赖 |
| 编译错误 | 语法错误、API 变更 | 修正代码 |
| 配置错误 | tsconfig/pyproject 有误 | 修正配置 |

### 3. 执行修复

原则：
- **最小改动**：只修复错误，不做任何无关改动
- **不降级**：不用 `any`、`@ts-ignore`、`// noqa` 绕过错误
- **不改接口**：优先调整实现而非修改公共接口

```markdown
### 修复清单
- [ ] 修复 1: `file.ts:10` — [修改内容]
- [ ] 修复 2: `file.ts:25` — [修改内容]
```

### 4. 验证修复

```bash
# 重新构建，确认错误已清除
# TypeScript: npx tsc --noEmit
# Python: mypy . && python -m py_compile .
# Go: go build ./...
# Swift: xcodebuild build
```

### 5. 回归检查

```bash
# 运行测试确保没有引入新问题
# TypeScript: npx vitest run
# Python: pytest
# Go: go test ./...
# Swift: xcodebuild test
```

## 报告格式

```markdown
## 构建修复报告

### 原始错误
- 错误数量: X
- 主要类型: [类型错误/依赖缺失/...]

### 修复措施
1. `file.ts:10` — [修复内容]
2. `file.ts:25` — [修复内容]

### 验证结果
- 构建: PASS
- 测试: PASS (X/Y 通过)
- 回归: 无

### 修改文件
- `path/to/file.ts`
```

## 重要原则

- 只做修复，不做重构
- 每个修复都要有明确的理由
- 如果错误是由依赖升级导致的，说明升级影响
- 无法修复的错误必须报告，不隐藏
