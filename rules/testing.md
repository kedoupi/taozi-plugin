# 测试规范

> 没有测试的代码 = 不存在的代码。

## 覆盖率要求

| 层级 | 最低覆盖率 | 说明 |
|------|-----------|------|
| 核心业务逻辑 | 80%+ | 计费、认证、数据转换等 |
| API 接口 | 70%+ | 请求/响应、错误码 |
| 工具函数 | 90%+ | 纯函数，易于测试 |
| UI 组件 | 50%+ | 关键交互路径即可 |

## 测试类型分层

```
       ┌──────────┐
       │  E2E 少量  │  ← 关键用户流程
       ├──────────┤
       │ 集成测试适量 │  ← 模块间交互
       ├──────────┤
       │ 单元测试大量 │  ← 核心 80% 测试量
       └──────────┘
```

- **单元测试**：测试单个函数/类，无外部依赖
- **集成测试**：测试模块间协作（数据库、API 调用）
- **E2E 测试**：测试完整用户流程，数量最少

## 测试命名规范

```javascript
// 格式：describe + it 结构化描述
describe('UserService', () => {
  describe('createUser', () => {
    it('应成功创建合法用户', () => { /* ... */ });
    it('应在用户名重复时抛出 DuplicateError', () => { /* ... */ });
    it('应在邮箱格式无效时返回校验错误', () => { /* ... */ });
  });
});
```

命名原则：
- 用"应...当..."描述期望行为
- 测试名要能当文档读，不用 `test1`、`test2`
- 正向 + 反向 + 边界都要覆盖

## Mock 使用原则

```javascript
// 推荐：只 mock 外部依赖（网络、数据库、时间）
jest.mock('axios');
jest.mock('../lib/db');

// 避免：mock 内部逻辑
jest.mock('../lib/validator'); // 不要 mock 自己的校验逻辑
jest.mock('../lib/calculator'); // 不要 mock 纯函数
```

原则：
- **只 mock 外部边界**：HTTP 请求、数据库、文件系统、第三方 SDK
- **不 mock 内部逻辑**：校验器、计算器、数据转换等纯函数
- mock 应该最小化：只模拟需要的行为，不要过度设置

## 测试文件组织

```
src/
  user/
    user-service.ts
    user-service.test.ts    ← 同目录，同名 + .test
    __fixtures__/           ← 测试数据
      user-data.json
```

- 测试文件与源文件同目录
- 命名为 `<filename>.test.ts`
- 共享测试数据放 `__fixtures__/` 目录
- 测试辅助函数放 `__helpers__/` 目录

## AAA 模式

每个测试遵循 Arrange-Act-Assert 模式：

```javascript
it('应正确计算折扣价', () => {
  // Arrange - 准备数据
  const price = 100;
  const discount = 0.2;

  // Act - 执行操作
  const result = calculateDiscount(price, discount);

  // Assert - 验证结果
  assert.strictEqual(result, 80);
});
```
