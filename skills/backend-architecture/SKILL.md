---
name: backend-architecture
description: 后端架构设计知识库 - API 设计、分层架构、认证授权、数据库。当进行后端开发、API 设计、系统架构时自动引用。
---

# 后端架构知识

后端系统设计和 API 架构的最佳实践。

## API 设计原则

### RESTful 设计
```
GET    /api/users          # 获取用户列表
GET    /api/users/:id      # 获取单个用户
POST   /api/users          # 创建用户
PUT    /api/users/:id      # 全量更新用户
PATCH  /api/users/:id      # 部分更新用户
DELETE /api/users/:id      # 删除用户

# 嵌套资源
GET    /api/users/:id/orders  # 用户的订单
POST   /api/orders/:id/items  # 订单的商品
```

### 响应格式
```typescript
// 成功响应
interface SuccessResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

// 错误响应
interface ErrorResponse {
  error: {
    code: string;      // 错误码 (如 "VALIDATION_ERROR")
    message: string;   // 用户友好的消息
    details?: Record<string, string[]>; // 字段错误
  };
}
```

### HTTP 状态码
```
200 OK           - 成功获取或更新
201 Created      - 成功创建
204 No Content   - 成功删除
400 Bad Request  - 请求参数错误
401 Unauthorized - 未认证
403 Forbidden    - 无权限
404 Not Found    - 资源不存在
409 Conflict     - 资源冲突
422 Unprocessable - 业务规则错误
500 Internal     - 服务器错误
```

## 分层架构

### 三层架构
```
┌─────────────────────────┐
│   Controller Layer      │  ← 处理 HTTP 请求/响应
├─────────────────────────┤
│   Service Layer         │  ← 业务逻辑
├─────────────────────────┤
│   Repository Layer      │  ← 数据访问
└─────────────────────────┘
```

### 代码示例
```typescript
// Controller - 处理 HTTP
@Controller('/users')
class UserController {
  constructor(private userService: UserService) {}

  @Get('/:id')
  async getUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }
}

// Service - 业务逻辑
class UserService {
  constructor(private userRepo: UserRepository) {}

  async findById(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }
}

// Repository - 数据访问
class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }
}
```

## 认证授权

### JWT 实现
```typescript
// 生成 Token
function generateTokens(userId: string) {
  const accessToken = jwt.sign(
    { sub: userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { sub: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

// 验证中间件
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### RBAC 权限控制
```typescript
// 权限检查装饰器
function RequirePermission(permission: string) {
  return (req, res, next) => {
    const userPermissions = req.user.permissions;
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// 使用
@Get('/admin/users')
@RequirePermission('users:read')
async listUsers() { /* ... */ }
```

## 数据库设计

### 表设计原则
```sql
-- 通用字段
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 业务字段
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  -- 审计字段
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP  -- 软删除
);

-- 索引策略
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created ON users(created_at DESC);
```

### ORM 模式 (Prisma)
```typescript
// schema.prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  orders    Order[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// 查询
const users = await prisma.user.findMany({
  where: { email: { contains: 'example' } },
  include: { orders: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
});
```

## 错误处理

### 全局错误处理
```typescript
// 自定义错误类
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
  }
}

// 全局错误处理中间件
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message }
    });
  }

  console.error(err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' }
  });
}
```

## 输入验证

### Zod 验证
```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(50),
});

// 验证中间件
function validate(schema: z.Schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: err.flatten().fieldErrors,
          }
        });
      }
      next(err);
    }
  };
}

// 使用
app.post('/users', validate(createUserSchema), createUser);
```

## 缓存策略

### Redis 缓存
```typescript
// 缓存装饰器
async function withCache<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const result = await fn();
  await redis.setex(key, ttl, JSON.stringify(result));
  return result;
}

// 使用
const user = await withCache(
  `user:${id}`,
  300, // 5分钟
  () => userService.findById(id)
);
```

## 日志规范

```typescript
// 结构化日志
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: Date.now() - start,
    });
  });
  next();
});
```
