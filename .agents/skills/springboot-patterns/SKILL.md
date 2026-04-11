---
name: springboot-patterns
description: Spring Boot 开发模式参考 — Controller、Service、Repository 分层、Spring Security、JPA。
---

# Spring Boot 开发模式参考

Spring Boot 企业级开发核心模式和最佳实践。

## 分层架构 (Controller / Service / Repository)

```java
// Controller - 只处理 HTTP 请求/响应
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @PostMapping
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody CreateUserRequest req) {
        UserDTO created = userService.create(req);
        URI location = URI.create("/api/users/" + created.id());
        return ResponseEntity.created(location).body(created);
    }
}

// Service - 业务逻辑
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public UserDTO findById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("用户不存在: " + id));
        return userMapper.toDTO(user);
    }

    @Transactional
    public UserDTO create(CreateUserRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ConflictException("邮箱已注册: " + req.email());
        }
        User user = userMapper.toEntity(req);
        return userMapper.toDTO(userRepository.save(user));
    }
}

// Repository - 数据访问
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);
}
```

## Spring Security 配置

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtFilter) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) -> res.sendError(401))
                .accessDeniedHandler((req, res, e) -> res.sendError(403))
            )
            .build();
    }
}
```

## JPA 实体设计

```java
@Entity
@Table(name = "users", uniqueConstraints = {
    @UniqueConstraint(columnNames = "email")
})
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    // 关联关系 - 延迟加载
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    private List<Order> orders = new ArrayList<>();
}
```

## 事务管理

```java
@Service
public class OrderService {

    // 只读事务 - 优化查询性能
    @Transactional(readOnly = true)
    public Page<OrderDTO> listOrders(Long userId, Pageable pageable) {
        return orderRepository.findByUserId(userId, pageable).map(orderMapper::toDTO);
    }

    // 写事务 - 发生异常自动回滚
    @Transactional
    public OrderDTO createOrder(CreateOrderRequest req) {
        Product product = productRepository.findByIdWithLock(req.productId())
            .orElseThrow(() -> new NotFoundException("商品不存在"));
        if (product.getStock() < req.quantity()) {
            throw new BusinessException("库存不足");
        }
        product.decreaseStock(req.quantity());
        Order order = Order.create(req.userId(), product, req.quantity());
        return orderMapper.toDTO(orderRepository.save(order));
    }
}
```

## 异常处理 (@ControllerAdvice)

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException e) {
        return ResponseEntity.status(404).body(new ErrorResponse("NOT_FOUND", e.getMessage()));
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflict(ConflictException e) {
        return ResponseEntity.status(409).body(new ErrorResponse("CONFLICT", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        Map<String, String> details = e.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(FieldError::getField, FieldError::getDefaultMessage));
        return ResponseEntity.badRequest().body(new ErrorResponse("VALIDATION_ERROR", "输入校验失败", details));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception e) {
        log.error("未处理异常", e);
        return ResponseEntity.status(500).body(new ErrorResponse("INTERNAL_ERROR", "服务器内部错误"));
    }
}
```

## 配置管理 (Profiles)

```yaml
# application.yml - 公共配置
spring:
  jpa:
    open-in-view: false
    hibernate:
      ddl-auto: validate

---
# application-dev.yml
spring:
  config:
    activate:
      on-profile: dev
  datasource:
    url: jdbc:postgresql://localhost:5432/myapp_dev
  jpa:
    show-sql: true

---
# application-prod.yml
spring:
  config:
    activate:
      on-profile: prod
  datasource:
    url: ${DATABASE_URL}
```

## DTO 转换

```java
// 推荐: MapStruct 编译时生成
@Mapper(componentModel = "spring")
public interface UserMapper {
    UserDTO toDTO(User user);
    User toEntity(CreateUserRequest req);
    @Mapping(target = "name", source = "req.name")
    @Mapping(target = "email", source = "req.email")
    void updateEntity(@MappingTarget User user, UpdateUserRequest req);
}

// record 定义 DTO
public record UserDTO(Long id, String name, String email, String role, Instant createdAt) {}
public record CreateUserRequest(
    @NotBlank String name,
    @Email String email,
    @Size(min = 8) String password
) {}
```

## Spring Data JPA 查询

```java
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // 方法名派生查询
    List<Product> findByCategoryAndPriceBetween(String category, BigDecimal min, BigDecimal max);

    // JPQL
    @Query("SELECT p FROM Product p WHERE p.name LIKE %:keyword% AND p.status = 'ACTIVE'")
    Page<Product> searchActive(@Param("keyword") String keyword, Pageable pageable);

    // 原生 SQL
    @Query(value = "SELECT * FROM products WHERE stock < :threshold", nativeQuery = true)
    List<Product> findLowStock(@Param("threshold") int threshold);

    // 悲观锁 - 防止超卖
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdWithLock(@Param("id") Long id);
}
```

## Actuator 监控

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health, info, metrics, prometheus
  endpoint:
    health:
      show-details: when-authorized
```

关键端点: `/actuator/health` | `/actuator/metrics` | `/actuator/prometheus` | `/actuator/info`
