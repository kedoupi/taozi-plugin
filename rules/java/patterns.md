---
name: java-patterns
description: Java 设计模式规范 — Spring 分层架构、Builder、Factory、Repository 模式
---

# Java 设计模式规范

## Spring 分层架构

```
Controller  → 处理 HTTP 请求/响应，不含业务逻辑
Service     → 业务逻辑，事务边界
Repository  → 数据访问，JPA/JDBC
Domain      → 实体、值对象、领域事件
DTO/Record  → 数据传输，不含逻辑
```

```java
// ✅ 各层职责清晰
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest req) {
        var order = orderService.createOrder(req);
        return ResponseEntity.created(URI.create("/api/orders/" + order.id()))
            .body(order);
    }
}

@Service
@Transactional
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;
    private final EventPublisher eventPublisher;

    public OrderResponse createOrder(CreateOrderRequest request) {
        inventoryService.reserve(request.items());  // 跨服务调用
        var order = Order.create(request);          // 领域对象工厂方法
        var saved = orderRepository.save(order);
        eventPublisher.publish(new OrderCreatedEvent(saved.id()));
        return OrderResponse.from(saved);           // DTO 映射
    }
}
```

## Builder 模式

```java
// ✅ 使用 Lombok @Builder 或 Record
@Builder
public record EmailMessage(
    String to,
    String subject,
    String body,
    @Builder.Default boolean html = false,
    @Builder.Default List<String> cc = List.of()
) {}

// 使用
var message = EmailMessage.builder()
    .to("alice@example.com")
    .subject("Welcome!")
    .body("<h1>Hello</h1>")
    .html(true)
    .build();
```

## Repository 模式

```java
// ✅ 接口定义在 domain 层，实现在 infrastructure 层
// domain/UserRepository.java
public interface UserRepository {
    Optional<User> findByEmail(String email);
    User save(User user);
    boolean existsByEmail(String email);
}

// infrastructure/JpaUserRepository.java
@Repository
public interface JpaUserRepository extends JpaRepository<UserEntity, UUID>, UserRepository {
    @Query("SELECT u FROM UserEntity u WHERE u.email = :email")
    Optional<User> findByEmail(@Param("email") String email);
}
```

## Factory Method

```java
// ✅ 领域对象用工厂方法，隐藏构造细节
public class Order {
    private final UUID id;
    private final List<OrderItem> items;
    private OrderStatus status;

    // 私有构造器
    private Order(UUID id, List<OrderItem> items) {
        this.id = id;
        this.items = new ArrayList<>(items);
        this.status = OrderStatus.PENDING;
    }

    // 工厂方法，名称表达意图
    public static Order create(CreateOrderRequest request) {
        validateItems(request.items());
        return new Order(UUID.randomUUID(), request.items());
    }

    public static Order restore(UUID id, List<OrderItem> items, OrderStatus status) {
        var order = new Order(id, items);
        order.status = status;
        return order;
    }
}
```

## 事件驱动

```java
// ✅ 领域事件解耦跨模块通信
public record OrderCreatedEvent(UUID orderId, Instant occurredAt) {
    public OrderCreatedEvent(UUID orderId) {
        this(orderId, Instant.now());
    }
}

@Component
@RequiredArgsConstructor
public class OrderCreatedHandler implements ApplicationListener<OrderCreatedEvent> {
    private final EmailService emailService;

    @Override
    @Async
    public void onApplicationEvent(OrderCreatedEvent event) {
        emailService.sendOrderConfirmation(event.orderId());
    }
}
```
