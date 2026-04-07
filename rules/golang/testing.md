# Go 测试规范

> 本文件扩展 [common/testing.md](../testing.md)

## 表驱动测试

```go
func TestCalculateDiscount(t *testing.T) {
    tests := []struct {
        name      string
        price     float64
        discount  float64
        want      float64
        wantErr   bool
    }{
        {"正常折扣", 100, 0.2, 80, false},
        {"零折扣", 100, 0, 100, false},
        {"负价格", -10, 0.2, 0, true},
        {"折扣超限", 100, 1.5, 0, true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := CalculateDiscount(tt.price, tt.discount)
            if (err != nil) != tt.wantErr {
                t.Errorf("CalculateDiscount() error = %v, wantErr %v", err, tt.wantErr)
                return
            }
            if got != tt.want {
                t.Errorf("CalculateDiscount() = %v, want %v", got, tt.want)
            }
        })
    }
}
```

## Benchmark

```go
func BenchmarkCalculateDiscount(b *testing.B) {
    for i := 0; i < b.N; i++ {
        CalculateDiscount(100, 0.2)
    }
}

// 运行: go test -bench=. -benchmem
```

## testify 断言（可选）

```go
import "github.com/stretchr/testify/assert"
import "github.com/stretchr/testify/require"

func TestCreateUser(t *testing.T) {
    user, err := CreateUser("test@example.com")

    require.NoError(t, err)             // 失败立即停止
    assert.Equal(t, "test@example.com", user.Email)
    assert.NotZero(t, user.ID)
}
```

## 测试覆盖率

```bash
# 生成覆盖率报告
go test -cover ./...
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html

# CI 中设置最低覆盖率
go test -cover -coverprofile=coverage.out ./...
```

## TestMain 和 Setup

```go
func TestMain(m *testing.M) {
    // 全局 setup
    db := setupTestDB()
    defer db.Close()

    os.Exit(m.Run())
}
```

## 测试文件组织

```
user/
  service.go
  service_test.go        # 同包测试（访问未导出成员）
  integration_test.go    # 不同包（测试公开 API）
  testdata/              # 测试数据
    fixtures.json
```
