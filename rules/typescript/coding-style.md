# TypeScript 编码风格

> 本文件扩展 [common/coding-style.md](../coding-style.md)

## 严格模式与类型安全

```typescript
// tsconfig.json 必须开启
// "strict": true
// "noUncheckedIndexedAccess": true
// "exactOptionalPropertyTypes": true

// 禁止 any，用 unknown + 收窄
function parse(input: unknown): User {
  if (typeof input !== 'object' || input === null) {
    throw new TypeError('Expected object');
  }
  return input as User; // 收窄后安全转换
}

// 禁止非空断言 !
// ❌ const name = user!.name;
// ✅ const name = user?.name ?? 'default';
```

## Const 断言与字面量类型

```typescript
// ✅ 用 as const 冻结对象和数组
const ROLES = ['admin', 'editor', 'viewer'] as const;
type Role = (typeof ROLES)[number]; // 'admin' | 'editor' | 'viewer'

// ✅ 用 satisfies 约束类型同时保留字面量
const config = {
  port: 3000,
  host: 'localhost',
} satisfies Record<string, string | number>;
```

## 模块组织

- 使用 ES Module (`import/export`)，禁止 `require()`
- 按类型分组导入：三方库 → 内部模块 → 类型
- 禁止 barrel file 过度导出（`index.ts` 导出全部）

```typescript
// ✅ 导入顺序
import { z } from 'zod';                // 三方库
import { db } from '@/lib/db';           // 内部模块
import type { User } from '@/types';     // 类型导入用 type 关键字
```

## Interface vs Type

```typescript
// ✅ 对象形状用 interface（可扩展）
interface User {
  id: string;
  name: string;
}

// ✅ 联合/交叉/映射用 type
type Result<T> = { ok: true; data: T } | { ok: false; error: Error };
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
```

## 枚举规范

```typescript
// ❌ 禁止数字枚举（反向映射陷阱）
enum Direction { Up, Down }

// ✅ 用 const enum 或联合类型
const Direction = { Up: 'UP', Down: 'DOWN' } as const;
type Direction = (typeof Direction)[keyof typeof Direction];
```

## 函数签名

```typescript
// ✅ 参数不超过 4 个，超过则用对象参数
function createUser(opts: { name: string; email: string; role: Role }): User {
  // ...
}

// ✅ 返回类型显式声明（导出函数必须）
export function getUser(id: string): Promise<User> {
  // ...
}
```
