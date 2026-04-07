# Python 自动化钩子

> 本文件扩展 [common/coding-style.md](../coding-style.md)

## 格式化：Black + isort

```toml
# pyproject.toml
[tool.black]
line-length = 100
target-version = ["py312"]

[tool.isort]
profile = "black"
line_length = 100
known_first_party = ["myapp"]
```

```bash
# 格式化命令
black .
isort .
```

## 类型检查：mypy

```toml
[tool.mypy]
python_version = "3.12"
strict = true
warn_return_any = true
disallow_untyped_defs = true
```

```bash
# 必须在 CI 中执行
mypy myapp/
```

## Linting：Ruff

```toml
[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = [
    "E",     # pycodestyle errors
    "W",     # pycodestyle warnings
    "F",     # pyflakes
    "I",     # isort
    "N",     # pep8-naming
    "UP",    # pyupgrade
    "B",     # flake8-bugbear
    "SIM",   # flake8-simplify
    "TCH",   # flake8-type-checking
]

[tool.ruff.lint.per-file-ignores]
"tests/*" = ["D100", "D101"]
```

```bash
ruff check .
ruff check --fix .
```

## pre-commit 配置

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.8.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.13.0
    hooks:
      - id: mypy
        args: [--strict]
        additional_dependencies: [pydantic]
```

## CI 流水线脚本

```bash
# 完整检查
ruff check . && mypy myapp/ && pytest --cov=myapp
```
