---
name: testing-strategies
description: 测试策略和框架参考。设计测试用例、选择测试框架时使用。
---

# 测试策略

## 何时使用

- 设计测试策略
- 选择测试框架
- 编写测试用例

## 测试金字塔

```
        /\
       /E2E\        少量关键路径
      /------\
     /Integration\  中等数量
    /--------------\
   /   Unit Tests   \ 大量快速测试
  /------------------\
```

## 测试框架选择

| 类型 | JS/TS | Python |
|------|-------|--------|
| 单元 | Jest, Vitest | pytest |
| 组件 | React Testing Library | - |
| E2E | Playwright, Cypress | - |
| API | Supertest | pytest |

## AAA 模式

```typescript
describe('功能模块', () => {
  it('应该在正常输入时返回预期结果', () => {
    // Arrange - 准备
    const input = 'test';

    // Act - 执行
    const result = functionUnderTest(input);

    // Assert - 断言
    expect(result).toBe('expected');
  });
});
```

## Mock 策略

| 场景 | 策略 |
|------|------|
| 外部服务 | 必须 Mock |
| 数据库 | 集成测试用真实 DB |
| 时间/随机数 | Mock 确保可重复 |

## 覆盖率目标

| 类型 | 目标 |
|------|------|
| 行覆盖 | 80%+ |
| 分支覆盖 | 75%+ |
| 关键路径 | 100% |

## 最佳实践

### DO
- 测试行为而非实现
- 每个测试只验证一个概念
- 保持测试快速和可靠

### DON'T
- 测试私有方法
- 测试间共享状态
- 写脆弱的 E2E 测试
