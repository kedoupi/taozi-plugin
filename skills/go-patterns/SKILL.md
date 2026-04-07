---
name: go-patterns
description: Go 开发模式参考 — goroutine、channel、interface、error handling、泛型。
---

# Go 开发模式参考

Go 现代开发核心模式和最佳实践。

## Goroutine/Channel 模式

```go
// Fan-out/Fan-in 模式
func fanOutFanIn(inputs []string) []Result {
    ch := make(chan Result, len(inputs))
    for _, input := range inputs {
        go func(in string) { ch <- process(in) }(input)
    }
    var results []Result
    for i := 0; i < len(inputs); i++ { results = append(results, <-ch) }
    return results
}

// Context 超时控制
ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()
```

规则: 永远用 `context.Context` | goroutine 必须有退出机制 | `select` + `default` 防阻塞

## Interface 组合

```go
// 小接口，组合使用
type UserStore interface {
    GetByID(ctx context.Context, id string) (*User, error)
    Save(ctx context.Context, user *User) error
}

// 隐式实现
type PostgresUserStore struct { db *sql.DB }
func (s *PostgresUserStore) GetByID(ctx context.Context, id string) (*User, error) { ... }
```

原则: 接口尽量小(1-2方法) | 消费者定义 | 组合代继承 | 避免 `interface{}`/`any`

## Error Handling

```go
type NotFoundError struct { Resource, ID string }
func (e *NotFoundError) Error() string {
    return fmt.Sprintf("%s %s not found", e.Resource, e.ID)
}

// errors.Is / errors.As
if errors.Is(err, os.ErrNotExist) { ... }
var notFound *NotFoundError
if errors.As(err, &notFound) { fmt.Println(notFound.Resource) }

// Wrap 错误链
return fmt.Errorf("save user %s: %w", id, err)

// sentinel errors
var ErrNotFound = errors.New("not found")
```

## 泛型

```go
type Number interface {
    ~int | ~int8 | ~int16 | ~int32 | ~int64 | ~float32 | ~float64
}

func Max[T Number](a, b T) T {
    if a > b { return a }; return b
}

func Filter[T any](slice []T, pred func(T) bool) []T {
    result := make([]T, 0, len(slice))
    for _, v := range slice { if pred(v) { result = append(result, v) } }
    return result
}

func Map[T, U any](slice []T, fn func(T) U) []U {
    result := make([]U, len(slice))
    for i, v := range slice { result[i] = fn(v) }
    return result
}
```

## Context 传递

```go
func (s *Service) HandleRequest(ctx context.Context, req Request) error {
    type ctxKey string
    ctx = context.WithValue(ctx, ctxKey("requestID"), req.ID)
    ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
    defer cancel()
    return s.store.Save(ctx, data)
}
```

## 测试模式

```go
func TestAdd(t *testing.T) {
    tests := []struct {
        name     string; a, b, expected int
    }{
        {"positive", 1, 2, 3},
        {"negative", -1, -2, -3},
        {"zero", 0, 0, 0},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            assert.Equal(t, tt.expected, Add(tt.a, tt.b))
        })
    }
}

// Interface mock
type MockUserStore struct {
    GetFn func(ctx context.Context, id string) (*User, error)
}
func (m *MockUserStore) GetByID(ctx context.Context, id string) (*User, error) {
    return m.GetFn(ctx, id)
}
```
