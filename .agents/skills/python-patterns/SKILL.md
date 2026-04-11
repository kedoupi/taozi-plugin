---
name: python-patterns
description: Python 开发模式参考 — 类型提示、async、dataclass、FastAPI、常见陷阱。
---

# Python 开发模式参考

Python 现代开发核心模式和最佳实践。

## 类型提示 (Type Hints)

```python
from typing import Optional, Union, Literal, TypeVar, Protocol

def greet(name: str, age: int = 0) -> str: ...
def find_user(id: int) -> Optional[dict]: ...
def parse(value: str) -> Union[int, float]: ...
def set_mode(mode: Literal["dev", "prod", "test"]) -> None: ...

# 泛型
T = TypeVar("T")
def first(items: list[T]) -> Optional[T]:
    return items[0] if items else None

# Protocol（结构化类型）
class Closeable(Protocol):
    def close(self) -> None: ...

def cleanup(resource: Closeable) -> None:
    resource.close()
```

## dataclass / Pydantic

```python
from dataclasses import dataclass, field

@dataclass(frozen=True)  # 不可变，可哈希
class Point:
    x: float; y: float

# 默认值陷阱: 用 field(default_factory=...)
@dataclass
class Config:
    tags: list[str] = field(default_factory=list)  # 不要用 []
```

```python
from pydantic import BaseModel, Field

class UserCreate(BaseModel):
    email: str = Field(..., pattern=r"^[\w.-]+@[\w.-]+\.\w+$")
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=0, le=150)
```

何时用: **dataclass** = 内部逻辑 | **Pydantic** = API 边界/外部数据

## async/await

```python
import asyncio, httpx

async def fetch_data(url: str) -> dict:
    async with httpx.AsyncClient() as client:
        r = await client.get(url); r.raise_for_status(); return r.json()

# 并发
async def fetch_all(urls: list[str]) -> list[dict]:
    return await asyncio.gather(*[fetch_data(u) for u in urls])

# 信号量控制并发
async def fetch_limited(urls: list[str], max_concurrent: int = 10) -> list[dict]:
    sem = asyncio.Semaphore(max_concurrent)
    async def limited(url): 
        async with sem: return await fetch_data(url)
    return await asyncio.gather(*[limited(u) for u in urls])
```

## FastAPI 模式

```python
from fastapi import FastAPI, Depends, HTTPException, status

app = FastAPI(title="My API", version="1.0.0")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session: yield session

@app.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(data: UserCreate, db: AsyncSession = Depends(get_db)) -> User:
    user = User(**data.model_dump())
    db.add(user); await db.commit(); await db.refresh(user)
    return user
```

## 常见陷阱

### 可变默认参数

```python
# 错误: 默认列表在所有调用间共享
def append_to(item: int, target: list[int] = []) -> list[int]: ...

# 正确: None + 内部创建
def append_to(item: int, target: list[int] | None = None) -> list[int]:
    if target is None: target = []
    target.append(item); return target
```

### GIL 限制

```python
# CPU 密集型: async 无法加速，用多进程
from concurrent.futures import ProcessPoolExecutor
with ProcessPoolExecutor() as pool:
    result = await loop.run_in_executor(pool, cpu_bound_function)
```

### 其他

- `is` vs `==`: `is` 检查身份, `==` 检查值
- 闭包陷阱: `lambda i=i: i` 而非 `lambda: i`
- 异常处理: 不要 `except Exception: pass`

## 测试 (pytest)

```python
import pytest

@pytest.mark.parametrize("input_val,expected", [("hello", 5), ("", 0)])
def test_length(input_val: str, expected: int) -> None:
    assert len(input_val) == expected

@pytest.mark.asyncio
async def test_create_user(client: AsyncClient) -> None:
    r = await client.post("/users", json={"email": "t@t.com", "name": "T"})
    assert r.status_code == 201
```
