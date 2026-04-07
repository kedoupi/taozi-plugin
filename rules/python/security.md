# Python 安全规范

> 本文件扩展 [common/security.md](../security.md)

## 禁止危险序列化

```python
# ❌ 绝对禁止 pickle / shelve（远程代码执行风险）
import pickle
data = pickle.loads(user_input)  # RCE 漏洞

# ✅ 使用 JSON 或 msgpack
import json
data = json.loads(user_input)  # 安全，只有基础类型
```

## SQL 注入防护

```python
# ✅ 使用 SQLAlchemy 参数化查询
from sqlalchemy import text

session.execute(
    text("SELECT * FROM users WHERE id = :user_id"),
    {"user_id": user_id},
)

# ✅ ORM 方式（自动参数化）
user = session.query(User).filter(User.id == user_id).first()

# ❌ 禁止字符串拼接
session.execute(f"SELECT * FROM users WHERE id = '{user_id}'")
```

## 安全审计工具

```bash
# Bandit - Python 安全扫描
bandit -r myapp/ -f json -o bandit-report.json

# pip-audit - 依赖漏洞检查
pip-audit --strict

# safety - 依赖安全检查
safety check --json
```

## 环境变量管理

```python
# ✅ 启动时验证环境变量
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str = Field(min_length=32)
    debug: bool = False

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

settings = Settings()  # 缺少必填项时立即失败
```

## 虚拟环境隔离

```bash
# ✅ 每个项目独立虚拟环境
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.lock

# ❌ 禁止全局安装项目依赖
pip install myapp  # 全局污染
```

## 文件操作安全

```python
# ✅ 使用 safe_join 防止路径穿越
from werkzeug.utils import safe_join
file_path = safe_join(base_dir, user_filename)

# ❌ 直接拼接用户输入
file_path = os.path.join(base_dir, user_filename)  # 可被 ../ 穿越
```
