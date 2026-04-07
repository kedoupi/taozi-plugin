# Go 编码风格

> 本文件扩展 [common/coding-style.md](../coding-style.md)

## 格式化与静态检查

```bash
# 必须执行，无例外
gofmt -w .
go vet ./...

# 禁止绕过 vet 的检查
```

## 变量声明

```go
// ✅ 短变量声明（函数内）
user := fetchUser(id)
count := len(items)

// ✅ var 声明（零值有意义时或包级别）
var buf bytes.Buffer
var (
    defaultTimeout = 30 * time.Second
    maxRetries     = 3
)

// ❌ 函数内不必要的 var
var name string = "test"  // 应该用 name := "test"
```

## 错误处理

```go
// ✅ 立即处理错误，不堆积
user, err := repo.GetByID(ctx, id)
if err != nil {
    return fmt.Errorf("get user %s: %w", id, err)
}

// ✅ 自定义错误类型（需要匹配时）
type NotFoundError struct {
    Resource string
    ID       string
}

func (e *NotFoundError) Error() string {
    return fmt.Sprintf("%s %s not found", e.Resource, e.ID)
}

// ❌ 忽略错误
user, _ := repo.GetByID(ctx, id)
```

## 包组织

```
project/
  cmd/           # 入口 main 包
    server/
      main.go
  internal/      # 私有包，外部不可导入
    user/
      service.go
      repository.go
    auth/
      handler.go
  pkg/           # 公共库（谨慎添加）
    validator/
      validator.go
  go.mod
```

## 命名规范

| 类型 | 风格 | 示例 |
|------|------|------|
| 导出函数/类型 | PascalCase | `GetUser`, `UserService` |
| 未导出函数 | camelCase | `parseInput`, `validateEmail` |
| 接口 | -er 后缀 | `Reader`, `Writer`, `Stringer` |
| 常量 | MixedCase / CamelCase | `maxRetries`, `DefaultTimeout` |
| 错误变量 | Err 前缀 | `ErrNotFound`, `ErrTimeout` |

## 接口定义

```go
// ✅ 在使用方定义接口，不要在实现方
// consumer 包
type UserGetter interface {
    GetByID(ctx context.Context, id string) (*User, error)
}

// ✅ 小接口（1-2 个方法）
type Validator interface {
    Validate() error
}
```
