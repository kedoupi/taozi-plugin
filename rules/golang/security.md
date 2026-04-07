# Go 安全规范

> 本文件扩展 [common/security.md](../security.md)

## SQL 注入防护

```go
// ✅ 使用 database/sql 参数化查询
row := db.QueryRowContext(ctx, "SELECT * FROM users WHERE id = $1", userID)

// ✅ 使用 sqlx
var user User
err := sqlx.GetContext(ctx, db, &user, "SELECT * FROM users WHERE id = $1", userID)

// ❌ 禁止字符串拼接 SQL
query := fmt.Sprintf("SELECT * FROM users WHERE id = '%s'", userID)
```

## 输入验证

```go
import "regexp"

// ✅ 在处理前验证所有输入
var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

func validateEmail(email string) error {
    if !emailRegex.MatchString(email) {
        return fmt.Errorf("invalid email format: %s", email)
    }
    return nil
}
```

## TLS 配置

```go
import "crypto/tls"

// ✅ 安全 TLS 配置
tlsConfig := &tls.Config{
    MinVersion: tls.VersionTLS12,
    CipherSuites: []uint16{
        tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
        tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
    },
}

// ❌ 禁止跳过证书验证
tlsConfig := &tls.Config{InsecureSkipVerify: true}
```

## 安全 Cookie

```go
import "net/http"

// ✅ 安全 Cookie 设置
cookie := &http.Cookie{
    Name:     "session",
    Value:    token,
    Path:     "/",
    MaxAge:   3600,
    HttpOnly: true,
    Secure:   true,
    SameSite: http.SameSiteStrictMode,
}
```

## gosec 安全扫描

```bash
# 安装并运行
go install github.com/securego/gosec/v2/cmd/gosec@latest
gosec ./...

# CI 集成
gosec -fmt=json -out=report.json ./...
```

## 文件路径安全

```go
import "path/filepath"

// ✅ 清理路径防止穿越
safePath := filepath.Join(baseDir, filepath.Clean(userInput))
if !strings.HasPrefix(safePath, baseDir) {
    return fmt.Errorf("path traversal detected")
}
```
