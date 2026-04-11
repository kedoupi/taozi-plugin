---
name: database-migrations
description: 数据库迁移模式 — Prisma、Drizzle、Django、Go 迁移策略、零停机迁移。
---

# 数据库迁移模式参考

数据库 Schema 变更和数据迁移的核心模式和最佳实践。

## Expand-Contract 模式 (零停机迁移)

```
阶段一: Expand (向后兼容，添加)
  ALTER TABLE users ADD COLUMN full_name VARCHAR(200);
  # 旧代码读写 name 字段 → 不受影响
  # 新代码同时写 name + full_name

阶段二: 迁移数据
  UPDATE users SET full_name = name WHERE full_name IS NULL;
  # 分批执行，避免锁表

阶段三: Contract (清理旧列)
  # 确认所有服务已切换到 full_name 后
  ALTER TABLE users DROP COLUMN name;
```

原则: 永远先加后删 | 每步可独立回滚 | 合约期至少一个部署周期

## Prisma Migrate

```bash
# 开发流程
npx prisma migrate dev --name add-user-avatar
# 生成 migration.sql + 更新 Prisma Client

# 生产部署
npx prisma migrate deploy
# 只执行未应用的迁移，不重新生成 Client

# 回滚: 手动创建反向迁移
npx prisma migrate dev --create-down --name revert-avatar
```

```prisma
// schema.prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  avatar    String?  // 新增字段，nullable 确保向后兼容
  createdAt DateTime @default(now())
}

// 迁移文件: prisma/migrations/20240101_add_user_avatar/migration.sql
-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatar" TEXT;
```

## Drizzle Migrations

```typescript
// schema.ts
import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  avatar: text("avatar"),  // 新增
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

```bash
# 生成迁移 SQL
npx drizzle-kit generate

# 查看迁移状态
npx drizzle-kit migrate

# 推送到数据库 (开发环境)
npx drizzle-kit push
```

## Django Migrations

```python
# 自动生成 Schema 迁移
python manage.py makemigrations

# 数据迁移 (单独文件)
from django.db import migrations

def populate_full_name(apps, schema_editor):
    User = apps.get_model("myapp", "User")
    for user in User.objects.all().iterator(chunk_size=1000):
        user.full_name = f"{user.first_name} {user.last_name}".strip()
        user.save(update_fields=["full_name"])

class Migration(migrations.Migration):
    dependencies = [("myapp", "0004_add_full_name")]

    operations = [
        migrations.RunPython(populate_full_name, migrations.RunPython.noop),
    ]
```

```bash
# 查看迁移计划
python manage.py showmigrations myapp

# 回滚
python manage.py migrate myapp 0003

# 空 migration (用于数据迁移)
python manage.py makemigrations --empty myapp
```

## Go 迁移 (goose)

```go
// migrations/001_create_users.sql
-- +goose Up
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- +goose Down
DROP TABLE users;
```

```go
// migrations/002_add_avatar.go
-- +goose Up
ALTER TABLE users ADD COLUMN avatar TEXT;

-- +goose Down
ALTER TABLE users DROP COLUMN avatar;
```

```bash
goose postgres $DATABASE_URL up          # 执行所有迁移
goose postgres $DATABASE_URL down        # 回滚一个版本
goose postgres $DATABASE_URL status      # 查看状态
goose postgres $DATABASE_URL create add_index sql  # 创建新迁移
```

## 零停机迁移: 加列 → 回填 → 加约束

```sql
-- 步骤 1: 添加可空列 (不锁表)
ALTER TABLE orders ADD COLUMN customer_id UUID;
-- PostgreSQL: 大多数情况不锁表
-- MySQL: ALGORITHM=INPLACE, LOCK=NONE

-- 步骤 2: 分批回填 (避免长事务)
-- 每批 1000 行，间隔 100ms
UPDATE orders SET customer_id = (
    SELECT id FROM customers WHERE customers.order_id = orders.id
) WHERE customer_id IS NULL LIMIT 1000;
-- 重复直到影响行数为 0

-- 步骤 3: 加 NOT NULL 约束 (PostgreSQL 方式)
ALTER TABLE orders ALTER COLUMN customer_id SET NOT NULL;
-- 或分两步避免锁表:
ALTER TABLE orders ADD CONSTRAINT orders_customer_id_not_null
    CHECK (customer_id IS NOT NULL) NOT VALID;
-- 验证: ALTER TABLE orders VALIDATE CONSTRAINT orders_customer_id_not_null;
-- 然后: ALTER TABLE orders ALTER COLUMN customer_id SET NOT NULL;
```

## 回滚策略

```
场景一: 纯加列/加表
  → 直接 DROP (生产少见)

场景二: 已有新代码在写新列
  → 新代码先停写 → 回填缺失值 → 回滚应用 → 再清理列

场景三: 改了列类型
  → 需要 expand-contract: 新列 → 迁移 → 旧代码切新列 → 删旧列
```

## 数据迁移 vs Schema 迁移

```
Schema 迁移: 修改表结构 (DDL)
  - ADD/DROP/ALTER COLUMN
  - CREATE/DROP INDEX
  - 通常很快，风险较低

数据迁移: 修改数据内容 (DML)
  - 批量 UPDATE/INSERT/DELETE
  - 必须分批执行，避免锁表
  - 必须有回滚脚本
  - 大数据量用后台任务 (Celery/go routine)
```

## 迁移测试

```python
# 测试迁移可回滚
def test_migration_is_reversible():
    """确保每个迁移都有有效的反向操作"""
    for migration in get_pending_migrations():
        apply(migration)
        rollback(migration)
        # 验证数据库状态一致

# 测试数据迁移正确性
def test_user_full_name_migration():
    user = User.objects.create(first_name="三", last_name="张")
    run_migration("0004_populate_full_name")
    user.refresh_from_db()
    assert user.full_name == "三 张"
```
