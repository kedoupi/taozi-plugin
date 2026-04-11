---
name: springboot-tdd
description: Spring Boot TDD 实践 — JUnit 5、Mockito、@SpringBootTest、切片测试、测试容器、RED→GREEN→REFACTOR 循环。
---

# Spring Boot TDD 实践

Spring Boot 项目中的测试驱动开发完整指南。

## 测试分层策略

```
单元测试（Unit）    → 纯 Java，无 Spring Context，用 Mockito
切片测试（Slice）   → 只加载部分 Context（Web层/JPA层），快速
集成测试（Integration）→ 完整 Context + 真实数据库（Testcontainers）
```

## 单元测试（Service 层）

```java
// ✅ 纯单元测试，不启动 Spring
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private UserService userService;

    @Test
    void createUser_shouldSendWelcomeEmail() {
        // Red: 先写测试
        var request = new CreateUserRequest("alice@example.com", "Alice");
        var savedUser = new User(UUID.randomUUID(), "alice@example.com", "Alice");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        // Green: 实现让测试通过
        var result = userService.createUser(request);

        assertThat(result.email()).isEqualTo("alice@example.com");
        verify(emailService).sendWelcome(savedUser);
    }

    @Test
    void createUser_shouldThrow_whenEmailExists() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThatThrownBy(() ->
            userService.createUser(new CreateUserRequest("alice@example.com", "Alice"))
        ).isInstanceOf(EmailAlreadyExistsException.class);
    }
}
```

## 切片测试（Web 层）

```java
// ✅ 只加载 Web 层，不启动完整 Spring Context
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void createUser_shouldReturn201() throws Exception {
        var request = new CreateUserRequest("alice@example.com", "Alice");
        var response = new UserResponse(UUID.randomUUID(), "alice@example.com", "Alice");
        when(userService.createUser(any())).thenReturn(response);

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.email").value("alice@example.com"));
    }

    @Test
    void createUser_shouldReturn400_whenEmailInvalid() throws Exception {
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"invalid\",\"name\":\"Alice\"}"))
            .andExpect(status().isBadRequest());
    }
}
```

## 切片测试（JPA 层）

```java
// ✅ 只加载 JPA Context，用内存数据库
@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByEmail_shouldReturnUser_whenExists() {
        var user = userRepository.save(new User(null, "alice@example.com", "Alice"));

        var found = userRepository.findByEmail("alice@example.com");

        assertThat(found).isPresent()
            .get().extracting(User::getName).isEqualTo("Alice");
    }

    @Test
    void findByEmail_shouldReturnEmpty_whenNotExists() {
        assertThat(userRepository.findByEmail("nobody@example.com")).isEmpty();
    }
}
```

## 集成测试（Testcontainers）

```java
// ✅ 真实 PostgreSQL，零 schema 差异
@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
class UserIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("testdb");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private UserService userService;

    @Test
    @Transactional
    void fullFlow_createAndFindUser() {
        var created = userService.createUser(new CreateUserRequest("test@example.com", "Test"));
        var found = userService.findById(created.id());
        assertThat(found.email()).isEqualTo("test@example.com");
    }
}
```

## TDD 循环实施

```
1. RED:    写一个失败的测试（先不实现）
2. GREEN:  写最少代码让测试通过（不要过度设计）
3. REFACTOR: 在测试保护下重构
```

```java
// 步骤1 (RED): 测试先于实现
@Test
void calculateDiscount_shouldApply20Percent_forPremiumUser() {
    var order = new Order(BigDecimal.valueOf(100), UserType.PREMIUM);
    assertThat(discountService.calculate(order))
        .isEqualByComparingTo(BigDecimal.valueOf(80));  // 编译失败 → 先创建接口
}

// 步骤2 (GREEN): 最简实现
@Service
public class DiscountService {
    public BigDecimal calculate(Order order) {
        if (order.userType() == UserType.PREMIUM) {
            return order.amount().multiply(BigDecimal.valueOf(0.8));
        }
        return order.amount();
    }
}

// 步骤3 (REFACTOR): 提取常量，保持测试通过
private static final Map<UserType, BigDecimal> DISCOUNT_RATES = Map.of(
    UserType.PREMIUM, BigDecimal.valueOf(0.8),
    UserType.STANDARD, BigDecimal.ONE
);
```

## 检查清单

- [ ] Service 层用纯单元测试（Mockito，无 Spring Context）
- [ ] Controller 层用 `@WebMvcTest`
- [ ] Repository 层用 `@DataJpaTest`
- [ ] 关键业务流程有 Testcontainers 集成测试
- [ ] 测试名称表达意图：`methodName_should_when`
- [ ] 每个测试只验证一件事
- [ ] 避免在测试中使用 `@Autowired` 拉取真实 Bean（除集成测试）
