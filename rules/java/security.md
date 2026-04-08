---
name: java-security
description: Java 安全规范 — 注入防护、认证授权、序列化安全、依赖管理
---

# Java 安全规范

## SQL 注入防护

```java
// ❌ 字符串拼接 SQL
String query = "SELECT * FROM users WHERE email = '" + email + "'";
em.createQuery(query).getResultList();

// ✅ 参数化查询
@Query("SELECT u FROM User u WHERE u.email = :email")
Optional<User> findByEmail(@Param("email") String email);

// ✅ JPQL 参数化
TypedQuery<User> query = em.createQuery(
    "SELECT u FROM User u WHERE u.email = :email", User.class
);
query.setParameter("email", email);
```

## 命令注入防护

```java
// ❌ 危险：用户输入进入 shell 命令
Runtime.getRuntime().exec("convert " + userFilename);

// ✅ 使用 ProcessBuilder 并分离参数
new ProcessBuilder("convert", sanitizedFilename)
    .redirectErrorStream(true)
    .start();
```

## 反序列化安全

```java
// ❌ 危险：直接反序列化不可信数据
ObjectInputStream ois = new ObjectInputStream(inputStream);
Object obj = ois.readObject();  // 可能触发恶意代码

// ✅ 使用 JSON（Jackson）并配置安全选项
ObjectMapper mapper = new ObjectMapper();
mapper.activateDefaultTyping(
    LaissezFaireSubTypeValidator.instance,
    ObjectMapper.DefaultTyping.NON_FINAL  // 仅允许指定类型
);

// ✅ 或完全禁用默认类型
mapper.disable(MapperFeature.DEFAULT_VIEW_INCLUSION);
mapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
```

## 密钥管理

```java
// ❌ 硬编码密钥
private static final String JWT_SECRET = "mysecretkey123";

// ✅ 环境变量 + @Value
@Value("${jwt.secret}")
private String jwtSecret;

// ✅ 密钥长度检查
@PostConstruct
void validateSecretKey() {
    if (jwtSecret.length() < 32) {
        throw new IllegalStateException("JWT secret must be at least 32 characters");
    }
}
```

## 输入验证

```java
// ✅ Bean Validation + 自定义约束
public record CreateUserRequest(
    @Email @NotBlank String email,
    @NotBlank @Size(min = 2, max = 50) String name,
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$") String password
) {}

// ✅ Controller 层启用验证
@PostMapping
public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest req) { ... }
```

## 路径穿越防护

```java
// ❌ 危险：直接使用用户提供的文件名
Path file = Paths.get(uploadDir, userFilename);

// ✅ 规范化并验证路径在允许目录内
Path uploadPath = Paths.get(uploadDir).toRealPath();
Path targetPath = uploadPath.resolve(userFilename).normalize();
if (!targetPath.startsWith(uploadPath)) {
    throw new SecurityException("Path traversal detected");
}
```

## 日志安全

```java
// ❌ 日志记录敏感数据
log.info("User login: email={}, password={}", email, password);

// ✅ 脱敏处理
log.info("User login attempt: email={}", email);
// 密码永远不记日志

// ✅ 防止日志注入（CRLF）
String safeInput = userInput.replaceAll("[\r\n]", "_");
log.info("Processing: {}", safeInput);
```

## 依赖安全

```xml
<!-- pom.xml：使用 OWASP Dependency Check -->
<plugin>
    <groupId>org.owasp</groupId>
    <artifactId>dependency-check-maven</artifactId>
    <version>9.0.0</version>
    <configuration>
        <failBuildOnCVSS>7</failBuildOnCVSS>  <!-- CVSS ≥ 7 阻止构建 -->
    </configuration>
</plugin>
```
