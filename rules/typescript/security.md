# TypeScript 安全规范

> 本文件扩展 [common/security.md](../security.md)

## XSS 防护

```typescript
// ✅ 使用 DOMPurify 清理用户 HTML
import DOMPurify from 'dompurify';
const safeHTML = DOMPurify.sanitize(userInput);

// ❌ 禁止直接注入原始 HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ React JSX 默认转义，信任框架机制
<p>{userInput}</p>
```

## HTTP 安全头

```typescript
// ✅ 使用 Helmet 设置安全响应头
import helmet from 'helmet';
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
  },
}));
```

## 输入验证（Zod）

```typescript
import { z } from 'zod';

// ✅ 在 API 边界用 Zod 验证所有输入
const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
});

// 使用解析后的安全数据
app.post('/users', (req, res) => {
  const input = CreateUserSchema.parse(req.body); // 失败抛 ZodError
  // ...
});
```

## 禁止危险操作

```typescript
// ❌ 绝对禁止
eval('const x = ' + userInput);
new Function('return ' + userInput)();
document.write(userInput);

// ❌ 禁止原型污染
Object.assign({}.__proto__, userInput);
merge(target, JSON.parse(userInput)); // 未验证的深拷贝
```

## 依赖安全审计

```bash
# 定期执行
npm audit --production
npx better-npm-audit audit
pnpm audit

# CI 中集成
npx audit-ci --moderate
```

## 环境变量类型安全

```typescript
// ✅ 启动时验证环境变量
const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

const env = EnvSchema.parse(process.env); // 启动时失败快速暴露
```
