---
name: java-testing
description: Java 测试规范 — JUnit 5、Mockito、测试命名、分层测试策略、覆盖率要求
---

# Java 测试规范

## 测试命名

```java
// 格式：methodName_should[ExpectedBehavior]_when[Condition]
@Test
void createUser_shouldReturnUser_whenValidRequest() { }

@Test
void createUser_shouldThrowException_whenEmailAlreadyExists() { }

@Test
void calculateDiscount_shouldApply20Percent_forPremiumUser() { }
```

## 测试结构（AAA）

```java
@Test
void processPayment_shouldChargeCorrectAmount() {
    // Arrange
    var order = OrderFactory.create(BigDecimal.valueOf(100));
    var paymentMethod = PaymentMethodFactory.creditCard("4111111111111111");
    when(paymentGateway.charge(any())).thenReturn(ChargeResult.success("txn_123"));

    // Act
    var result = paymentService.process(order, paymentMethod);

    // Assert
    assertThat(result.transactionId()).isEqualTo("txn_123");
    assertThat(result.amount()).isEqualByComparingTo(BigDecimal.valueOf(100));
    verify(paymentGateway).charge(argThat(req -> req.amount().equals(BigDecimal.valueOf(100))));
}
```

## 分层测试策略

| 层级 | 注解 | 速度 | 用途 |
|------|------|------|------|
| 单元 | `@ExtendWith(MockitoExtension.class)` | 极快 | Service/Domain 逻辑 |
| Web 切片 | `@WebMvcTest` | 快 | Controller 请求/响应 |
| JPA 切片 | `@DataJpaTest` | 中 | Repository 查询 |
| 集成 | `@SpringBootTest` + Testcontainers | 慢 | 关键业务流程 |

## 覆盖率要求

- Service 层：≥ 85%
- Domain 层（实体/值对象）：≥ 90%
- Controller 层：≥ 80%
- Repository 层：≥ 70%

## Mock 规范

```java
// ✅ 只 mock 外部依赖，不 mock 被测对象内部
@Mock UserRepository userRepository;   // 外部依赖
@Mock EmailService emailService;        // 外部依赖
@InjectMocks UserService userService;   // 被测对象

// ❌ 不 mock 被测对象的私有方法
// doReturn("x").when(spy).privateMethod(); ← 这是坏味道

// ✅ Argument Captor 验证复杂参数
@Captor ArgumentCaptor<UserCreatedEvent> eventCaptor;

verify(eventPublisher).publish(eventCaptor.capture());
assertThat(eventCaptor.getValue().userId()).isEqualTo(expectedId);
```

## 参数化测试

```java
@ParameterizedTest
@CsvSource({
    "PREMIUM, 100.00, 80.00",
    "STANDARD, 100.00, 95.00",
    "TRIAL, 100.00, 100.00"
})
void calculateDiscount_shouldApplyCorrectRate(
    UserType userType, BigDecimal amount, BigDecimal expected
) {
    var result = discountService.calculate(amount, userType);
    assertThat(result).isEqualByComparingTo(expected);
}
```

## 禁止行为

- 禁止 `Thread.sleep()` 在测试中
- 禁止测试之间有状态依赖（每个测试独立）
- 禁止 `@Disabled` 长期留存（修复或删除）
- 禁止只测 happy path（至少覆盖一个异常路径）
