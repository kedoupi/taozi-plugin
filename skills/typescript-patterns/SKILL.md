---
name: typescript-patterns
description: TypeScript 高级类型模式参考。当处理复杂泛型、条件类型、映射类型或类型体操时使用。
---

# TypeScript 类型模式

## 何时使用

- 复杂泛型设计
- 类型体操问题
- 类型安全架构
- 条件类型和映射类型

## 核心模式速查

### 条件类型
```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;
```

### 映射类型
```typescript
type Partial<T> = { [K in keyof T]?: T[K] };
type Required<T> = { [K in keyof T]-?: T[K] };
type Readonly<T> = { readonly [K in keyof T]: T[K] };
```

### 模板字面量
```typescript
type EventName<T extends string> = `on${Capitalize<T>}`;
```

### 品牌类型
```typescript
type Brand<T, B> = T & { __brand: B };
type UserId = Brand<string, 'UserId'>;
```

## 最佳实践

### DO
- 启用 strict 模式
- 优先使用 unknown 而非 any
- 使用类型守卫而非类型断言
- 利用类型推断，避免冗余注解

### DON'T
- 滥用 any 类型
- 过度使用类型断言 (as)
- 忽略类型错误（使用 @ts-ignore）
- 写过于复杂的类型体操

## 详细参考

- 高级类型示例：见 [references/advanced-types.md](references/advanced-types.md)
