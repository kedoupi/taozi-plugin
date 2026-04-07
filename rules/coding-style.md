# 编码风格规范

> 简洁、一致、可读。代码是写给人看的，顺便让机器执行。

## 不可变性优先

```javascript
// 推荐
const MAX_RETRY = 3;
const items = [1, 2, 3];
const result = items.map(transform);

// 避免
let MAX_RETRY = 3;     // 常量不该用 let
var items = [1, 2, 3]; // 永远不要用 var
items.forEach((x, i) => items[i] = transform(x)); // 直接变异
```

## 文件组织

- 一个文件一个职责（单一职责原则）
- 文件名反映内容：`user-service.ts` 而非 `utils.ts`
- 导出明确：默认导出一个，命名导出辅助函数
- 文件长度不超过 300 行；超过则考虑拆分

## 错误处理

```javascript
// 推荐：明确处理每个错误
try {
  await saveUser(user);
} catch (err) {
  if (err.code === 'DUPLICATE_KEY') {
    return { status: 409, message: '用户已存在' };
  }
  logger.error('保存用户失败', { userId: user.id, err });
  throw err; // 重新抛出无法处理的错误
}

// 避免：吞掉异常
try { await saveUser(user); } catch (e) { /* ignore */ }

// 避免：只打印不处理
try { await saveUser(user); } catch (e) { console.log(e); }
```

## 命名规范

| 类型 | 风格 | 示例 |
|------|------|------|
| 函数 | 动词开头 camelCase | `fetchUser`, `validateInput`, `calculateTotal` |
| 类/接口 | 名词 PascalCase | `UserService`, `AuthMiddleware`, `Config` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY`, `DEFAULT_TIMEOUT` |
| 变量 | 名词 camelCase | `userList`, `totalCount`, `isActive` |
| 布尔变量 | is/has/can 前缀 | `isLoading`, `hasPermission`, `canEdit` |

## 注释规范

注释解释"为什么"，代码解释"做什么"。

```javascript
// reason: 第三方 API 限制每秒 10 次调用，超出返回 429
const DELAY_MS = 100;

// 避免：复述代码（没有信息增量）
// 延迟 100 毫秒
const DELAY_MS = 100;
```

## 简洁原则

- 3 行重复代码 > 1 个过早抽象
- 提取函数的条件：重复 3 次以上，且逻辑稳定
- 不要为了"优雅"引入不必要的中间层
- 宁可平铺直述，不要过度嵌套

```javascript
// 推荐：平铺清晰
if (!user) return null;
if (!user.isActive) return null;
return user.profile;

// 避免：过度嵌套
if (user) {
  if (user.isActive) {
    return user.profile;
  }
}
```

## 类型安全 (TypeScript)

- 禁止 `any`，用 `unknown` 替代并收窄类型
- 禁止非空断言 `!`，用可选链 `?.` 或显式判断
- 优先用 `interface` 定义对象，`type` 做联合/交叉
- 导出的类型必须有注释说明用途
