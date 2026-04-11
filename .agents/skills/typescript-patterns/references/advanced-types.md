# TypeScript 高级类型示例

## 条件类型

```typescript
// 提取函数返回类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// 提取 Promise 内部类型
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

// 过滤联合类型
type FilterString<T> = T extends string ? T : never;
type OnlyStrings = FilterString<string | number | boolean>; // string
```

## 映射类型

```typescript
// 可选属性
type Partial<T> = { [K in keyof T]?: T[K] };

// 必选属性
type Required<T> = { [K in keyof T]-?: T[K] };

// 只读属性
type Readonly<T> = { readonly [K in keyof T]: T[K] };

// 键重映射
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface Person { name: string; age: number; }
type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number; }
```

## 模板字面量类型

```typescript
// 事件名称类型
type EventName<T extends string> = `on${Capitalize<T>}`;
type ClickEvent = EventName<'click'>; // 'onClick'

// CSS 属性类型
type CSSProperty = `${number}${'px' | 'em' | 'rem' | '%'}`;
const width: CSSProperty = '100px'; // ✓
const invalid: CSSProperty = '100'; // ✗

// API 路由类型
type APIRoute = `/api/${string}/${number}`;
const route: APIRoute = '/api/users/123'; // ✓
```

## 递归类型

```typescript
// 深度只读
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K];
};

// 深度可选
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? DeepPartial<T[K]>
    : T[K];
};

// JSON 类型
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };
```

## 类型守卫

```typescript
// 自定义类型守卫
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// 断言函数
function assertNonNull<T>(
  value: T,
  message?: string
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(message ?? 'Value is null or undefined');
  }
}

// 判别联合
type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

function handleResult<T, E>(result: Result<T, E>) {
  if (result.success) {
    console.log(result.data); // TypeScript 知道类型
  } else {
    console.error(result.error);
  }
}
```

## 品牌类型

```typescript
// 创建名义类型
type Brand<T, B> = T & { __brand: B };

type UserId = Brand<string, 'UserId'>;
type OrderId = Brand<string, 'OrderId'>;

function getUser(id: UserId) { /* ... */ }
function getOrder(id: OrderId) { /* ... */ }

const userId = 'user_123' as UserId;
const orderId = 'order_456' as OrderId;

getUser(userId);   // ✓
getUser(orderId);  // ✗ 类型错误！
```

## 实用工具类型

### 内置工具类型
```typescript
Partial<T>        // 所有属性可选
Required<T>       // 所有属性必选
Readonly<T>       // 所有属性只读
Pick<T, K>        // 选取指定属性
Omit<T, K>        // 排除指定属性
Record<K, V>      // 键值对类型
Exclude<T, U>     // 从 T 排除 U
Extract<T, U>     // 从 T 提取 U
NonNullable<T>    // 排除 null 和 undefined
Parameters<T>     // 函数参数类型
ReturnType<T>     // 函数返回类型
```

### 自定义工具类型
```typescript
// 可选指定属性
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 必选指定属性
type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// 可变类型（移除 readonly）
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

// 获取对象值类型
type ValueOf<T> = T[keyof T];

// 路径类型
type Path<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends object
    ? `${K}.${Path<T[K]>}` | K
    : K
  : never;
```

## 常见问题解决

### 类型收窄失效
```typescript
// ❌ 问题：回调中类型收窄失效
function example(value: string | null) {
  if (value !== null) {
    setTimeout(() => {
      value.toUpperCase(); // 错误：value 可能是 null
    }, 100);
  }
}

// ✅ 解决：保存到局部变量
function example(value: string | null) {
  if (value !== null) {
    const nonNullValue = value;
    setTimeout(() => {
      nonNullValue.toUpperCase(); // ✓
    }, 100);
  }
}
```

### 索引签名问题
```typescript
// 启用 noUncheckedIndexedAccess
// tsconfig: "noUncheckedIndexedAccess": true
const obj: Record<string, number> = { a: 1 };
const value = obj['b']; // number | undefined（而非 number）
```

### 泛型约束
```typescript
// ❌ 无法访问属性
function getLength<T>(value: T) {
  return value.length; // 错误
}

// ✅ 添加约束
function getLength<T extends { length: number }>(value: T) {
  return value.length; // ✓
}
```
