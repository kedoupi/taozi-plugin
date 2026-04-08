---
name: java-hooks
description: Java 项目的 Claude 行为约束 — 自动检查项、禁止行为、Java 专项铁律
---

# Java 项目 Claude 行为约束

## 编辑 Java 文件后自动检查

每次修改 Java 文件后，在声明完成前必须验证：

```bash
# 编译检查
mvn compile -q 2>&1 | tail -5

# 检查字段注入（自动修复建议）
grep -n '@Autowired' {modified_file} | grep -v '//'

# 检查 System.out 残留
grep -n 'System\.out\.' {modified_file}

# 检查 null 返回（Service/Repository 层）
grep -n 'return null' {modified_file}
```

## 创建新 Java 类时

必须确认以下内容：
- [ ] 明确所属层级（Controller / Service / Repository / Domain）
- [ ] 注入方式为构造器注入（非字段注入）
- [ ] 有对应的测试类骨架
- [ ] 使用 `Optional` 而非 null 返回

## 禁止行为

1. **禁止字段注入** — 始终使用构造器注入 + `@RequiredArgsConstructor`
2. **禁止在 Controller 写业务逻辑** — Controller 只做 HTTP 层处理
3. **禁止在 Service 写 SQL** — SQL 逻辑属于 Repository 层
4. **禁止跳过 @Valid** — Controller 参数必须加 `@Valid`
5. **禁止忽略 Optional** — `repository.findById()` 返回必须处理 empty

## Java 版本约束

- 最低 Java 17（records, sealed classes, text blocks）
- Spring Boot 3.x（Jakarta EE，非 javax）
- 新建项目推荐 Java 21（virtual threads）

## 依赖引入规范

新增依赖前必须：
1. 检查项目是否已有类似功能的库（避免重复引入）
2. 确认 Maven Central 上有稳定版本
3. 检查 LICENSE 兼容性

## Lombok 使用规范

```java
// ✅ 允许使用
@RequiredArgsConstructor  // 构造器注入
@Builder                   // Builder 模式
@Slf4j                     // 日志

// ❌ 限制使用
@Data   // 会生成 setter，破坏不可变性，改用 @Value 或 Record
@Setter // 除非明确需要可变性
```
