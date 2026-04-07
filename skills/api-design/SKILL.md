---
name: api-design
description: REST API 设计模式 — 端点命名、分页、错误处理、版本管理、OpenAPI 规范。
---

# REST API 设计模式参考

RESTful API 设计的核心模式和最佳实践。

## RESTful 端点命名

```
# 资源用名词复数
GET    /api/users              # 用户列表
POST   /api/users              # 创建用户
GET    /api/users/:id          # 获取用户
PATCH  /api/users/:id          # 更新用户
DELETE /api/users/:id          # 删除用户

# 嵌套资源 (最多两层)
GET    /api/users/:id/orders        # 用户的订单
POST   /api/users/:id/orders        # 为用户创建订单
GET    /api/orders/:id/items        # 订单的商品

# 动作用 POST + 动词端点
POST   /api/users/:id/activate      # 激活用户
POST   /api/orders/:id/cancel       # 取消订单
POST   /api/payments/:id/refund     # 退款

# 筛选用查询参数
GET    /api/orders?status=paid&sort=-created_at&limit=20
```

原则: 名词不用动词 | 复数不用单数 | 嵌套不超过两层 | 非 CRUD 操作用 POST + 动词

## 分页 (Cursor vs Offset)

```typescript
// Offset 分页 - 适合随机访问、总页数
interface OffsetPagination {
  data: User[];
  pagination: {
    total: number;      // 总记录数
    page: number;       // 当前页码 (从 1 开始)
    per_page: number;   // 每页数量
    total_pages: number;
  };
}
// GET /api/users?page=2&per_page=20

// Cursor 分页 - 适合无限滚动、大数据集
interface CursorPagination {
  data: User[];
  pagination: {
    next_cursor: string | null;   // 下一页游标
    prev_cursor: string | null;   // 上一页游标
    has_more: boolean;
  };
}
// GET /api/users?cursor=abc123&limit=20
```

选择: 小数据集/随机翻页用 Offset | 大数据集/实时数据用 Cursor

## 错误响应格式

```typescript
// 统一错误格式
interface APIError {
  error: {
    code: string;           // 机器可读: "VALIDATION_ERROR"
    message: string;        // 人类可读: "请求参数校验失败"
    details?: Array<{
      field: string;        // "email"
      issue: string;        // "邮箱格式不正确"
    }>;
    request_id: string;     // 用于排查
  };
}

// HTTP 状态码映射
// 400 - 请求格式/参数错误
// 401 - 未认证 (缺少或无效 token)
// 403 - 无权限 (认证但权限不足)
// 404 - 资源不存在
// 409 - 资源冲突 (如唯一约束)
// 422 - 业务规则错误
// 429 - 请求频率超限
// 500 - 服务器内部错误
```

## 版本管理

```
# 方案一: URL 路径 (推荐，简单明确)
GET /api/v1/users
GET /api/v2/users

# 方案二: Header (URL 更干净)
GET /api/users
Accept: application/vnd.myapi.v2+json

# 方案三: 查询参数 (不推荐)
GET /api/users?version=2
```

原则: URL 版本最实用 | 主版本号只做不兼容变更 | 小变更通过扩展字段实现

## OpenAPI / Swagger 规范

```yaml
# openapi.yaml
openapi: "3.1.0"
info:
  title: 用户服务 API
  version: "2.0.0"

paths:
  /api/v2/users:
    get:
      summary: 获取用户列表
      parameters:
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: per_page
          in: query
          schema: { type: integer, default: 20, maximum: 100 }
      responses:
        "200":
          description: 成功
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/UserListResponse"
        "400":
          description: 参数错误
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorResponse"

components:
  schemas:
    User:
      type: object
      required: [id, email, name]
      properties:
        id: { type: string, format: uuid }
        email: { type: string, format: email }
        name: { type: string, maxLength: 100 }
```

## 幂等性

```
# 幂等操作 - 重复调用结果相同
GET    /api/users/:id    # 幂等
PUT    /api/users/:id    # 幂等 (全量替换)
DELETE /api/users/:id    # 幂等 (删除已删除返回 404)

# 非幂等操作 - 每次调用可能产生不同结果
POST   /api/users        # 非幂等 (每次创建新用户)
POST   /api/orders       # 非幂等

# 幂等键模式 - 让 POST 也幂等
POST /api/orders
Idempotency-Key: unique-request-id
# 服务端记录 key，重复请求返回第一次的结果
```

## Rate Limiting

```typescript
// 响应 Header
X-RateLimit-Limit: 100        # 窗口内允许的最大请求数
X-RateLimit-Remaining: 67     # 剩余请求数
X-RateLimit-Reset: 1690000000 # 窗口重置时间 (Unix 时间戳)

// 超限响应
// HTTP 429 Too Many Requests
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "请求频率超限，请 30 秒后重试",
    "retry_after": 30
  }
}
```

## CORS 配置

```typescript
// 生产环境 CORS
const corsOptions = {
  origin: ["https://app.example.com"],  // 不用 *
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400,  // 预检缓存 24 小时
};
```

## HATEOAS (可选)

```json
{
  "data": { "id": "123", "name": "张三" },
  "links": {
    "self": "/api/users/123",
    "orders": "/api/users/123/orders",
    "avatar": "/api/users/123/avatar"
  }
}
```

大多数 REST API 不需要 HATEOAS，但 API 网关/超媒体驱动场景可用。
