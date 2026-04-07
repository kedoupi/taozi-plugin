# Go 自动化钩子

> 本文件扩展 [common/coding-style.md](../coding-style.md)

## 格式化：gofmt + goimports

```bash
# gofmt 是强制标准
gofmt -w .
goimports -w .
```

## Linting：golangci-lint

```yaml
# .golangci.yml
run:
  timeout: 5m
linters:
  enable:
    - errcheck
    - govet
    - staticcheck
    - unused
    - gosimple
    - gosec
    - revive
    - gocritic
```

```bash
golangci-lint run ./...
golangci-lint run --fix ./...
```

## go vet

```bash
# 必须执行
go vet ./...
```

## pre-commit 配置

```yaml
repos:
  - repo: https://github.com/dnephin/pre-commit-golang
    rev: v0.5.1
    hooks:
      - id: go-fmt
      - id: go-vet
      - id: go-imports
      - id: golangci-lint
      - id: go-unit-tests
```

## CI 流水线

```bash
set -euo pipefail
test -z "$(gofmt -l .)"              # 格式检查
go vet ./...                          # 静态分析
golangci-lint run ./...               # Lint
go test -race -cover ./...            # 测试
go build ./...                        # 构建
```
