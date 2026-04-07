---
name: tdd
description: TDD 工作流 — 先写测试(RED) → 最小实现(GREEN) → 重构(REFACTOR)
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
argument-hint: [功能描述]
---

# TDD 工作流

对 `$ARGUMENTS` 严格执行 RED → GREEN → REFACTOR 循环。

## 核心原则

- **测试先行**：必须先写失败的测试，再写实现代码
- **最小实现**：只写刚好让测试通过的代码，不多不少
- **小步迭代**：每次只添加一个测试用例，循环推进
- **重构安全**：所有测试通过后才重构，重构后立即验证

## 执行流程

### 阶段 1: RED（写失败测试）

1. 理解需求 `$ARGUMENTS`，拆分为小功能点
2. 选择当前最小的可测试功能点
3. 编写测试文件，描述期望行为

```markdown
### RED 检查清单
- [ ] 测试文件已创建
- [ ] 测试描述了期望的输入/输出行为
- [ ] 运行测试 → 确认失败（退出码非零）
- [ ] 失败原因正确（不是编译错误，而是断言失败）
```

执行验证：

```bash
# 运行测试，确认 RED 状态
# TypeScript: npx vitest run --reporter=verbose
# Python: pytest -xvs
# Go: go test -v -run TestXxx
# Swift: xcodebuild test -scheme ...
```

### 阶段 2: GREEN（最小实现）

1. 编写最少的代码使测试通过
2. 不考虑优雅、性能、扩展性
3. 可以硬编码返回值（如果这是当前最简单的做法）

```markdown
### GREEN 检查清单
- [ ] 实现代码已编写
- [ ] 运行测试 → 全部通过
- [ ] 没有添加多余的代码
- [ ] 没有提前优化
```

执行验证：

```bash
# 运行测试，确认 GREEN 状态
# 所有测试必须通过
```

### 阶段 3: REFACTOR（重构）

1. 在测试全部通过的前提下重构
2. 消除重复代码、改善命名、优化结构
3. 每次重构后立即运行测试验证

```markdown
### REFACTOR 检查清单
- [ ] 重复代码已消除
- [ ] 命名清晰准确
- [ ] 函数职责单一
- [ ] 运行测试 → 仍然全部通过
- [ ] 没有改变外部行为
```

### 循环

重复 RED → GREEN → REFACTOR，直到功能完成。

## 示例 TDD 会话

```
循环 1: 基本功能
  RED:   测试 "空列表返回空结果"
  GREEN: return []
  REFACTOR: 无需重构

循环 2: 正常路径
  RED:   测试 "有效输入返回正确结果"
  GREEN: 实现基本逻辑
  REFACTOR: 提取辅助函数

循环 3: 边界情况
  RED:   测试 "无效输入抛出错误"
  GREEN: 添加输入验证
  REFACTOR: 统一错误处理

循环 4: 完整功能
  RED:   测试 "并发场景"
  GREEN: 添加并发处理
  REFACTOR: 优化性能
```

## 覆盖率目标

- 行覆盖率 >= 80%
- 分支覆盖率 >= 70%
- 核心业务逻辑覆盖率 >= 90%

```bash
# 检查覆盖率
# TypeScript: npx vitest run --coverage
# Python: pytest --cov=module --cov-report=term-missing
# Go: go test -cover ./...
```

## 重要原则

- 永远不要在 RED 阶段写实现代码
- 永远不要在 GREEN 阶段过度设计
- 永远不要在 REFACTOR 阶段改变行为
- 每个循环不超过 5 分钟（如果超过，说明功能点太大）
- 提交时所有测试必须通过
