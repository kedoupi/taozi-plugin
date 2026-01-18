---
name: typescript-types
description: TypeScript 类型体操知识库 - 高级类型、条件类型、映射类型、类型守卫。当进行复杂类型定义、泛型设计时自动引用。
---

# TypeScript 类型体操

TypeScript 高级类型技巧和模式。

## 基础类型工具

### 内置工具类型
```typescript
// Partial - 所有属性可选
type Partial<T> = { [P in keyof T]?: T[P] };

// Required - 所有属性必填
type Required<T> = { [P in keyof T]-?: T[P] };

// Readonly - 所有属性只读
type Readonly<T> = { readonly [P in keyof T]: T[P] };

// Pick - 选取属性
type Pick<T, K extends keyof T> = { [P in K]: T[P] };

// Omit - 排除属性
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

// Record - 构造对象类型
type Record<K extends keyof any, T> = { [P in K]: T };

// ReturnType - 获取函数返回类型
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;

// Parameters - 获取函数参数类型
type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;
```

### 使用示例
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// 创建用户时，id 和 createdAt 由系统生成
type CreateUserInput = Omit<User, 'id' | 'createdAt'>;

// 更新用户时，所有字段可选
type UpdateUserInput = Partial<Omit<User, 'id'>>;

// 用户列表只需要部分字段
type UserListItem = Pick<User, 'id' | 'name'>;
```

## 条件类型

### 基础条件类型
```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<'hello'>; // true
type B = IsString<123>;      // false
```

### infer 推断
```typescript
// 提取数组元素类型
type ArrayElement<T> = T extends (infer E)[] ? E : never;
type Elem = ArrayElement<string[]>; // string

// 提取 Promise 值类型
type Awaited<T> = T extends Promise<infer R> ? Awaited<R> : T;
type Value = Awaited<Promise<Promise<string>>>; // string

// 提取函数第一个参数
type FirstArg<T> = T extends (first: infer F, ...args: any[]) => any ? F : never;
```

### 分布式条件类型
```typescript
type ToArray<T> = T extends any ? T[] : never;

type Result = ToArray<string | number>; // string[] | number[]

// 阻止分布
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;
type Result2 = ToArrayNonDist<string | number>; // (string | number)[]
```

## 映射类型

### 基础映射
```typescript
type Nullable<T> = { [K in keyof T]: T[K] | null };

type MutableRequired<T> = { -readonly [K in keyof T]-?: T[K] };
```

### 键重映射
```typescript
// 添加前缀
type Prefixed<T, P extends string> = {
  [K in keyof T as `${P}${Capitalize<string & K>}`]: T[K]
};

interface User { name: string; age: number }
type GetUser = Prefixed<User, 'get'>;
// { getName: string; getAge: number }

// 过滤键
type OnlyStrings<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K]
};
```

## 模板字面量类型

```typescript
type EventName<T extends string> = `on${Capitalize<T>}`;
type ClickEvent = EventName<'click'>; // 'onClick'

// 组合
type HttpMethod = 'get' | 'post' | 'put' | 'delete';
type Endpoint = '/users' | '/posts';
type ApiRoute = `${Uppercase<HttpMethod>} ${Endpoint}`;
// 'GET /users' | 'GET /posts' | 'POST /users' | ...
```

## 递归类型

```typescript
// 深度 Partial
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

// 深度 Readonly
type DeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

// 展平数组
type Flatten<T extends any[]> = T extends [infer First, ...infer Rest]
  ? First extends any[]
    ? [...Flatten<First>, ...Flatten<Rest>]
    : [First, ...Flatten<Rest>]
  : [];
```

## 实用类型模式

### API 响应类型
```typescript
interface ApiResponse<T> {
  data: T;
  error: null;
} | {
  data: null;
  error: { code: string; message: string };
}

// 带分页
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}
```

### 表单类型
```typescript
// 从 Schema 生成表单类型
type FormValues<T> = {
  [K in keyof T]: T[K] extends object
    ? FormValues<T[K]>
    : string;
};

// 表单错误类型
type FormErrors<T> = Partial<Record<keyof T, string>>;
```

### 事件处理
```typescript
type EventMap = {
  click: { x: number; y: number };
  keydown: { key: string };
  submit: { data: FormData };
};

type EventHandler<K extends keyof EventMap> = (event: EventMap[K]) => void;

function on<K extends keyof EventMap>(
  event: K,
  handler: EventHandler<K>
): void {
  // ...
}

on('click', ({ x, y }) => console.log(x, y));
on('keydown', ({ key }) => console.log(key));
```

### 路由参数
```typescript
type ExtractParams<T extends string> =
  T extends `${infer Start}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractParams<Rest>]: string }
    : T extends `${infer Start}:${infer Param}`
      ? { [K in Param]: string }
      : {};

type Params = ExtractParams<'/users/:id/posts/:postId'>;
// { id: string; postId: string }
```

## 类型守卫

```typescript
// 用户定义类型守卫
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// in 操作符
function isUser(obj: any): obj is User {
  return 'id' in obj && 'name' in obj;
}

// 断言函数
function assertIsNumber(value: unknown): asserts value is number {
  if (typeof value !== 'number') {
    throw new Error('Expected number');
  }
}
```

## 类型安全的实践

### 枚举替代
```typescript
// 使用 const 对象替代枚举
const Status = {
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

type Status = typeof Status[keyof typeof Status];
// 'pending' | 'active' | 'inactive'
```

### 品牌类型
```typescript
// 防止类型混淆
type UserId = string & { readonly brand: unique symbol };
type PostId = string & { readonly brand: unique symbol };

function getUser(id: UserId) { /* ... */ }

const userId = 'user-1' as UserId;
const postId = 'post-1' as PostId;

getUser(userId);  // OK
getUser(postId);  // Error: 类型不匹配
```

### 穷举检查
```typescript
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

type Status = 'pending' | 'active' | 'inactive';

function handleStatus(status: Status) {
  switch (status) {
    case 'pending': return 'Waiting';
    case 'active': return 'Running';
    case 'inactive': return 'Stopped';
    default: return assertNever(status); // 确保处理所有情况
  }
}
```
