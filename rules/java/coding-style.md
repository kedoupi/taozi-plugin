---
name: java-coding-style
description: Java 编码风格规范 — 命名、格式、可读性、现代 Java 特性使用
---

# Java 编码风格规范

Java 17+ 现代编码风格。

## 命名规范

```java
// 类：PascalCase，名词
class UserService { }
class OrderRepository { }

// 方法：camelCase，动词开头
void createUser() { }
Optional<User> findById(Long id) { }
boolean isEmailValid(String email) { }

// 常量：UPPER_SNAKE_CASE
static final int MAX_RETRY_COUNT = 3;
static final Duration DEFAULT_TIMEOUT = Duration.ofSeconds(30);

// 枚举值：UPPER_SNAKE_CASE
enum UserStatus { ACTIVE, INACTIVE, SUSPENDED }

// 包：全小写，点分隔
package com.example.user.service;
```

## 现代 Java 特性

```java
// ✅ Record（不可变数据类，替代 Lombok @Value）
public record UserDto(UUID id, String email, String name) {
    // 紧凑构造器做验证
    public UserDto {
        Objects.requireNonNull(email, "email must not be null");
        email = email.toLowerCase(); // 归一化
    }
}

// ✅ Sealed Class（封闭类型层次）
public sealed interface PaymentResult
    permits PaymentResult.Success, PaymentResult.Failure {

    record Success(String transactionId, BigDecimal amount) implements PaymentResult {}
    record Failure(String code, String message) implements PaymentResult {}
}

// ✅ Pattern Matching（instanceof 模式匹配）
String describe(Object obj) {
    return switch (obj) {
        case Integer i -> "Integer: " + i;
        case String s when s.isBlank() -> "Empty string";
        case String s -> "String: " + s;
        default -> "Unknown: " + obj.getClass().getSimpleName();
    };
}

// ✅ Text Block（多行字符串）
String json = """
    {
        "name": "%s",
        "email": "%s"
    }
    """.formatted(name, email);
```

## 方法设计

```java
// ✅ 短方法（≤ 20行），职责单一
// ✅ 参数不超过 4 个，超过用 Builder 或 Record
record CreateOrderRequest(
    UUID userId,
    List<OrderItem> items,
    Address shippingAddress,
    PaymentMethod paymentMethod
) {}

// ✅ 返回 Optional 而非 null
Optional<User> findByEmail(String email);

// ❌ 不返回 null
User findByEmail(String email);  // 调用方忘记 null 检查
```

## Stream API 规范

```java
// ✅ 简洁、可读的 stream 操作
var activeUserEmails = users.stream()
    .filter(u -> u.status() == UserStatus.ACTIVE)
    .map(User::email)
    .sorted()
    .toList();  // Java 16+，返回不可变 List

// ❌ 过度链式，难以 debug
var result = list.stream().filter(...).map(...).flatMap(...).reduce(...);

// ✅ 复杂操作拆分，赋予有意义的中间变量
var activeUsers = users.stream()
    .filter(u -> u.status() == UserStatus.ACTIVE)
    .toList();
var emailsByDomain = activeUsers.stream()
    .collect(groupingBy(u -> u.email().split("@")[1]));
```

## 不可变性

```java
// ✅ 集合使用不可变包装
List<String> items = List.of("a", "b", "c");
Map<String, Integer> scores = Map.of("alice", 100, "bob", 90);

// ✅ 字段能 final 就 final
private final UserRepository userRepository;
private final Clock clock;  // 注入 Clock，易于测试

// ❌ 不必要的 setter
public void setName(String name) { this.name = name; }
```

## 禁止行为

- 禁止 `System.out.println`（用 `log.info/debug`）
- 禁止裸 `catch (Exception e) { }`
- 禁止 `null` 返回值（用 `Optional`）
- 禁止字段注入 `@Autowired`（用构造器注入）
- 禁止 `new Date()`（用 `LocalDateTime.now(clock)`）
