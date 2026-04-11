---
name: sql-optimization
description: SQL 查询优化知识库 - 索引策略、查询优化、分页、事务。当进行数据库优化、慢查询分析、SQL 调优时自动引用。
---

# SQL 查询优化

数据库查询性能优化技巧和最佳实践。

## 索引策略

### 索引类型
```sql
-- B-Tree 索引（默认，适合范围查询）
CREATE INDEX idx_users_email ON users(email);

-- 唯一索引
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- 复合索引（遵循最左前缀原则）
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- 部分索引（只索引部分数据）
CREATE INDEX idx_orders_active ON orders(user_id)
WHERE status = 'active';

-- 覆盖索引（包含查询所需的所有列）
CREATE INDEX idx_users_email_name ON users(email) INCLUDE (name);
```

### 索引选择原则
```
1. WHERE 条件中频繁使用的列
2. JOIN 连接条件的列
3. ORDER BY / GROUP BY 的列
4. 高选择性的列（不同值多）
5. 避免索引频繁更新的列
```

### 复合索引顺序
```sql
-- 查询: WHERE a = ? AND b > ? ORDER BY c
-- 索引顺序: (a, b, c)

-- 等值条件列放前面
-- 范围条件列放中间
-- 排序列放后面
```

## 查询优化

### 避免全表扫描
```sql
-- 差：函数使列索引失效
SELECT * FROM users WHERE YEAR(created_at) = 2024;

-- 好：使用范围查询
SELECT * FROM users
WHERE created_at >= '2024-01-01'
  AND created_at < '2025-01-01';

-- 差：前缀通配符
SELECT * FROM users WHERE email LIKE '%@gmail.com';

-- 好：后缀通配符（可使用索引）
SELECT * FROM users WHERE email LIKE 'john%';
```

### 优化 JOIN
```sql
-- 差：笛卡尔积
SELECT * FROM orders, users WHERE orders.user_id = users.id;

-- 好：明确 JOIN 类型
SELECT * FROM orders
INNER JOIN users ON orders.user_id = users.id;

-- 小表驱动大表
SELECT * FROM small_table s
INNER JOIN large_table l ON s.id = l.small_id;
```

### N+1 问题
```typescript
// 差：N+1 查询
const users = await prisma.user.findMany();
for (const user of users) {
  user.orders = await prisma.order.findMany({
    where: { userId: user.id }
  });
}

// 好：使用 JOIN 或 include
const users = await prisma.user.findMany({
  include: { orders: true }
});

// 好：批量查询
const userIds = users.map(u => u.id);
const orders = await prisma.order.findMany({
  where: { userId: { in: userIds } }
});
```

## 分页优化

### 游标分页（推荐）
```sql
-- 差：OFFSET 大时性能差
SELECT * FROM posts ORDER BY id LIMIT 10 OFFSET 10000;

-- 好：游标分页
SELECT * FROM posts
WHERE id > :last_id  -- 游标
ORDER BY id
LIMIT 10;
```

### Keyset 分页
```sql
-- 复合排序的游标分页
SELECT * FROM posts
WHERE (created_at, id) < (:last_created_at, :last_id)
ORDER BY created_at DESC, id DESC
LIMIT 10;
```

## 聚合优化

### 避免 SELECT *
```sql
-- 差
SELECT * FROM users WHERE status = 'active';

-- 好：只选需要的列
SELECT id, name, email FROM users WHERE status = 'active';
```

### 预计算和缓存
```sql
-- 创建汇总表
CREATE TABLE daily_stats (
  date DATE PRIMARY KEY,
  total_orders INT,
  total_revenue DECIMAL(10,2)
);

-- 定时任务更新
INSERT INTO daily_stats (date, total_orders, total_revenue)
SELECT
  DATE(created_at),
  COUNT(*),
  SUM(amount)
FROM orders
WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
GROUP BY DATE(created_at)
ON CONFLICT (date) DO UPDATE SET
  total_orders = EXCLUDED.total_orders,
  total_revenue = EXCLUDED.total_revenue;
```

## 查询分析

### EXPLAIN 分析
```sql
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE user_id = 123 AND status = 'pending';

-- 关注点：
-- 1. Seq Scan vs Index Scan
-- 2. Rows (估计行数 vs 实际行数)
-- 3. Cost (启动成本 + 总成本)
-- 4. Actual Time
```

### 慢查询日志
```sql
-- PostgreSQL
ALTER SYSTEM SET log_min_duration_statement = '100ms';

-- MySQL
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 0.1;
```

## 事务优化

### 减少锁竞争
```sql
-- 差：长事务
BEGIN;
-- 大量操作...
-- 长时间持有锁
COMMIT;

-- 好：小事务
BEGIN;
-- 必要操作
COMMIT;
```

### 死锁预防
```sql
-- 固定锁顺序
-- 总是先锁 users 表，再锁 orders 表

BEGIN;
SELECT * FROM users WHERE id = 1 FOR UPDATE;
SELECT * FROM orders WHERE user_id = 1 FOR UPDATE;
-- 操作
COMMIT;
```

## 批量操作

### 批量插入
```sql
-- 差：逐条插入
INSERT INTO users (name, email) VALUES ('a', 'a@e.com');
INSERT INTO users (name, email) VALUES ('b', 'b@e.com');

-- 好：批量插入
INSERT INTO users (name, email) VALUES
  ('a', 'a@e.com'),
  ('b', 'b@e.com'),
  ('c', 'c@e.com');
```

### 批量更新
```sql
-- 使用 CASE WHEN
UPDATE products SET price =
  CASE id
    WHEN 1 THEN 100
    WHEN 2 THEN 200
    WHEN 3 THEN 300
  END
WHERE id IN (1, 2, 3);

-- PostgreSQL: 使用 VALUES
UPDATE products p SET price = v.price
FROM (VALUES (1, 100), (2, 200), (3, 300)) AS v(id, price)
WHERE p.id = v.id;
```

## 性能检查清单

- [ ] 查询使用了合适的索引
- [ ] 避免 SELECT *
- [ ] 避免 N+1 查询
- [ ] 大数据量分页使用游标
- [ ] 事务尽可能短
- [ ] 批量操作替代循环单条
- [ ] 定期分析慢查询日志
- [ ] 监控连接池使用情况

## 常见问题

### 索引失效情况
1. 使用函数处理索引列
2. 隐式类型转换
3. LIKE 前缀通配符
4. OR 条件（某些情况）
5. NOT IN / NOT EXISTS
6. 使用 != 或 <>

### 连接池配置
```typescript
// 连接池大小经验公式
// connections = (core_count * 2) + effective_spindle_count

const pool = new Pool({
  max: 20,           // 最大连接数
  min: 5,            // 最小连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```
