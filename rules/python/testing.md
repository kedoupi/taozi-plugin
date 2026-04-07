# Python 测试规范

> 本文件扩展 [common/testing.md](../testing.md)

## pytest 配置

```ini
# pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = "-v --tb=short"
```

## Fixtures 模式

```python
# tests/conftest.py
import pytest
from myapp.db import get_session
from myapp.models import User

@pytest.fixture
def db_session():
    """每个测试独立的数据库会话"""
    session = get_session(test_mode=True)
    yield session
    session.rollback()
    session.close()

@pytest.fixture
def sample_user(db_session):
    """创建测试用户"""
    user = User(name="Test User", email="test@example.com")
    db_session.add(user)
    db_session.commit()
    return user
```

## 参数化测试

```python
import pytest

@pytest.mark.parametrize("input_val, expected", [
    ("hello", "HELLO"),
    ("World", "WORLD"),
    ("", ""),
    ("123", "123"),
])
def test_uppercase(input_val: str, expected: str) -> None:
    assert input_val.upper() == expected

# 多参数组合
@pytest.mark.parametrize("x", [1, 2])
@pytest.mark.parametrize("y", [10, 20])
def test_multiply(x: int, y: int) -> None:
    assert x * y > 0
```

## Mock/patch 模式

```python
from unittest.mock import patch, MagicMock

# ✅ mock 外部依赖，不 mock 内部逻辑
@patch("myapp.service.requests.get")
def test_fetch_user(mock_get: MagicMock) -> None:
    mock_get.return_value.json.return_value = {"id": "1", "name": "Test"}
    user = fetch_user("1")
    assert user.name == "Test"
    mock_get.assert_called_once_with("https://api.example.com/users/1")
```

## 覆盖率配置

```ini
[tool.coverage.run]
source = ["myapp"]
omit = ["tests/*", "myapp/__main__.py"]

[tool.coverage.report]
fail_under = 80
show_missing = true
```

```bash
pytest --cov=myapp --cov-report=term-missing
```

## 测试目录结构

```
tests/
  conftest.py           # 共享 fixtures
  unit/
    test_user_service.py
  integration/
    test_api.py
  fixtures/
    sample_data.json
```
