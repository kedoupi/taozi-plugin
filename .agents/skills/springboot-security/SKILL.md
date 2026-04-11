---
name: springboot-security
description: Spring Boot Security 实践 — JWT 认证、RBAC 授权、CORS 配置、密码加密、OWASP Top 10 防护。
---

# Spring Boot Security 实践

Spring Security 6+ 的现代安全配置指南。

## SecurityFilterChain 配置

```java
// ✅ Spring Security 6+ Lambda DSL（弃用 WebSecurityConfigurerAdapter）
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthFilter jwtFilter)
            throws Exception {
        return http
            .csrf(csrf -> csrf.disable())  // REST API 无状态，禁用 CSRF
            .sessionManagement(sm -> sm.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/actuator/health").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);  // 强度 12，约 400ms hash
    }
}
```

## JWT 认证实现

```java
// ✅ JWT Filter
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);
        final String username = jwtService.extractUsername(token);

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            var userDetails = userDetailsService.loadUserByUsername(username);
            if (jwtService.isTokenValid(token, userDetails)) {
                var authToken = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        chain.doFilter(request, response);
    }
}
```

```java
// ✅ JWT Service
@Service
public class JwtService {
    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration:86400000}")  // 24h default
    private long expiration;

    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
            .subject(userDetails.getUsername())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(getSigningKey(), Jwts.SIG.HS256)
            .compact();
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
    }
}
```

## RBAC 方法级授权

```java
// ✅ 方法级注解（需 @EnableMethodSecurity）
@Service
public class DocumentService {

    @PreAuthorize("hasRole('ADMIN') or @documentPolicy.canRead(authentication, #id)")
    public Document findById(Long id) { ... }

    @PreAuthorize("hasRole('EDITOR')")
    public Document create(CreateDocumentRequest request) { ... }

    @PostAuthorize("returnObject.ownerId == authentication.principal.id")
    public Document findMyDocument(Long id) { ... }
}
```

## CORS 配置

```java
// ✅ 生产环境 CORS 精确配置
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    var config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(
        "https://app.example.com",
        "https://admin.example.com"
    ));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);

    var source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}
```

## 密码安全

```java
// ✅ BCrypt 加密，永不存储明文
@Service
@RequiredArgsConstructor
public class AuthService {
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    public void changePassword(String username, String oldPassword, String newPassword) {
        var user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UserNotFoundException(username));

        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new InvalidPasswordException();  // 不要说"旧密码错误"，防止枚举
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
```

## 全局异常处理（不泄露信息）

```java
// ✅ 生产环境不返回堆栈信息
@RestControllerAdvice
public class SecurityExceptionHandler {

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException e) {
        return ResponseEntity.status(403)
            .body(new ErrorResponse("ACCESS_DENIED", "权限不足"));
        // 不要返回具体原因（防止信息泄露）
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuth(AuthenticationException e) {
        return ResponseEntity.status(401)
            .body(new ErrorResponse("UNAUTHORIZED", "请先登录"));
    }
}
```

## 检查清单

- [ ] 密码使用 BCrypt，强度 ≥ 10
- [ ] JWT 密钥从环境变量读取，长度 ≥ 256 bit
- [ ] CORS 不使用通配符 `*`（生产环境）
- [ ] 所有端点有明确的权限配置
- [ ] 异常响应不泄露系统细节（无堆栈、无 SQL 错误）
- [ ] 使用 HTTPS（配置 `security.require-ssl=true`）
- [ ] 敏感操作有审计日志
- [ ] JWT 有合理过期时间（access: 15min，refresh: 7d）
