# Python 设计模式

> 本文件扩展 [common/coding-style.md](../coding-style.md)

## Protocol（结构化子类型）

```python
from typing import Protocol

# ✅ 用 Protocol 定义接口，不需要继承
class UserRepository(Protocol):
    def get_by_id(self, user_id: str) -> User | None: ...
    def save(self, user: User) -> None: ...

# 任何实现了这些方法的类都满足协议
class PostgresUserRepo:
    def get_by_id(self, user_id: str) -> User | None:
        ...
    def save(self, user: User) -> None:
        ...
```

## 异步模式

```python
import asyncio
from collections.abc import AsyncIterator

# ✅ async/await 配合上下文管理器
async def fetch_all_users() -> list[User]:
    async with aiohttp.ClientSession() as session:
        async with session.get("/api/users") as resp:
            return await resp.json()

# ✅ 异步生成器
async def stream_events() -> AsyncIterator[Event]:
    async for event in event_source:
        yield event
```

## 生成器模式

```python
# ✅ 用生成器处理大数据集（惰性求值）
def process_large_file(path: Path) -> Iterator[Record]:
    with path.open() as f:
        reader = csv.DictReader(f)
        for row in reader:
            if is_valid(row):
                yield Record(**row)

# 使用
valid_records = list(process_large_file(data_path))
```

## 依赖注入

```python
from dataclasses import dataclass

# ✅ 构造函数注入，不用全局状态
@dataclass
class UserService:
    repo: UserRepository
    notifier: NotificationService

    def create_user(self, data: CreateUserRequest) -> User:
        user = self.repo.save(User(**data.model_dump()))
        self.notifier.send_welcome(user)
        return user
```

## dataclass 最佳实践

```python
from dataclasses import dataclass, field

@dataclass(frozen=True, slots=True)  # 不可变 + 内存优化
class Money:
    amount: Decimal
    currency: str = "CNY"

    def add(self, other: Money) -> Money:
        if self.currency != other.currency:
            raise ValueError("Currency mismatch")
        return Money(self.amount + other.amount, self.currency)

# ✅ 用 field(default_factory=) 处理可变默认值
@dataclass
class Order:
    items: list[Item] = field(default_factory=list)
    total: Decimal = Decimal("0")
```
