# Go 设计模式

> 本文件扩展 [common/coding-style.md](../coding-style.md)

## 接口组合

```go
// ✅ 小接口，通过组合扩展
type Reader interface { Read(p []byte) (n int, err error) }
type Writer interface { Write(p []byte) (n int, err error) }
type ReadWriter interface {
    Reader
    Writer
}

// ✅ 在消费方定义接口
type UserStore interface {
    GetByID(ctx context.Context, id string) (*User, error)
}
```

## Goroutine 与 Channel

```go
func FanOut(inputs []string, workers int) []Result {
    ch := make(chan Result, len(inputs))
    var wg sync.WaitGroup
    for _, input := range inputs {
        wg.Add(1)
        go func(in string) {
            defer wg.Done()
            ch <- process(in)
        }(input)
    }
    go func() { wg.Wait(); close(ch) }()
    var results []Result
    for r := range ch { results = append(results, r) }
    return results
}
```

## Context 传播

```go
// ✅ Context 作为第一个参数，不存储在结构体中
func (s *Service) FetchUser(ctx context.Context, id string) (*User, error) {
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()
    return s.repo.GetByID(ctx, id)
}
```

## 中间件与 Option 模式

```go
type Middleware func(http.Handler) http.Handler

func Chain(h http.Handler, mws ...Middleware) http.Handler {
    for i := len(mws) - 1; i >= 0; i-- { h = mws[i](h) }
    return h
}

// ✅ Option 模式
type ServerOption func(*Server)
func WithPort(port int) ServerOption { return func(s *Server) { s.port = port } }
func NewServer(opts ...ServerOption) *Server {
    s := &Server{port: 8080}
    for _, opt := range opts { opt(s) }
    return s
}
```

## 错误包装

```go
// ✅ %w 包装 + errors.Is/As 检查
if errors.Is(err, sql.ErrNoRows) { return nil, ErrNotFound }

var (
    ErrNotFound     = errors.New("resource not found")
    ErrUnauthorized = errors.New("unauthorized")
)
```
