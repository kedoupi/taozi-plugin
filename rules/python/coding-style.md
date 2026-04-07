# Python 编码风格

> 本文件扩展 [common/coding-style.md](../coding-style.md)

## PEP 8 + 类型提示

```python
# ✅ 所有公开函数必须有类型提示
def fetch_user(user_id: str, *, include_deleted: bool = False) -> User | None:
    ...

# ✅ 使用 from __future__ 兑现 Python 3.10+ 语法
from __future__ import annotations

# ✅ 类型别名用 type 语句 (3.12+) 或 TypeAlias
type Vector = list[float]
ConnectionOptions: TypeAlias = dict[str, str]
```

## 数据模型选择

```python
# ✅ 内部数据结构用 dataclass
from dataclasses import dataclass, field

@dataclass(frozen=True)  # 不可变
class Address:
    street: str
    city: str
    zip_code: str

# ✅ API 边界/验证用 Pydantic
from pydantic import BaseModel, field_validator

class CreateUserRequest(BaseModel):
    name: str
    email: str
    age: int = Field(ge=0, le=150)

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        if '@' not in v:
            raise ValueError('Invalid email')
        return v
```

## 字符串格式化

```python
# ✅ 使用 f-string
message = f"用户 {user.name} 创建于 {user.created_at:%Y-%m-%d}"

# ❌ 禁止 % 和 .format()
message = "用户 %s 创建" % user.name
message = "用户 {}".format(user.name)
```

## 文件与路径操作

```python
# ✅ 使用 pathlib，禁止 os.path
from pathlib import Path

config_path = Path(__file__).parent / "config.yaml"
if config_path.exists():
    content = config_path.read_text(encoding="utf-8")

# ✅ 使用 context manager 管理资源
with open(config_path) as f:
    data = yaml.safe_load(f)
```

## 命名规范

| 类型 | 风格 | 示例 |
|------|------|------|
| 函数/方法 | snake_case | `fetch_user`, `calculate_total` |
| 类 | PascalCase | `UserService`, `AuthMiddleware` |
| 常量 | UPPER_SNAKE | `MAX_RETRY`, `DEFAULT_TIMEOUT` |
| 私有成员 | _前缀 | `_internal_cache`, `_validate` |
| 模块 | snake_case | `user_service.py` |
