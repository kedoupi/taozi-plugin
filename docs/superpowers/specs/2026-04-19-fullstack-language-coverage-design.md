# 设计文档：taozi 全栈语言覆盖扩展

**日期**: 2026-04-19  
**状态**: 待审阅  
**参考**: https://github.com/affaan-m/everything-claude-code

---

## 背景与动机

taozi 的 `fullstack-developer` agent 声称"端到端开发主力专家，覆盖前端、后端、数据库"，但实际深度支持只有 TypeScript/Node.js 一个技术栈：

- `build-error-resolver` 只懂 TypeScript 报错
- Python、Go、Java 有 reviewer 但没有 build-resolver
- Rust、Kotlin、C++、C#、Flutter 完全没有覆盖

用户在非 TypeScript 项目中遭遇构建报错时，taozi 无法给出有效帮助。"全栈"名不符实。

---

## 目标

让 taozi 真正覆盖主流全栈语言，每门语言提供**三件套**完整支持：

1. `{lang}-reviewer` — 专项代码审查，聚焦该语言独有的陷阱和惯用法
2. `{lang}-build-resolver` — 构建/编译报错修复，懂该语言的工具链
3. `{lang}-patterns` skill — 惯用法参考，供开发时随时调用

---

## 设计原则

参考 everything-claude-code 仓库的结构，每个语言 agent 遵循统一模式：

### reviewer 设计原则
- 聚焦该语言**独有**的坑（不重复通用代码质量规则）
- 分 CRITICAL / HIGH / MEDIUM 三级严重度
- 列出该语言的专用静态分析工具（lint/vet/clippy 等）
- 审查流程：`git diff` 获取变更 → 工具链分析 → 输出表格报告

### build-resolver 设计原则
- 覆盖该语言常见编译/构建错误模式
- **最小修复策略**：只改报错代码，不做额外重构
- 工作流：识别错误 → 定位根因 → 最小修复 → 验证构建
- 三次修复失败后停止，不盲目重试

### patterns skill 设计原则
- 覆盖该语言 **3-5 个核心惯用法**（并发模型、错误处理、内存管理等）
- 提供 ❌/✅ 对比代码示例
- 聚焦该语言与其他语言最不同的部分

---

## 覆盖范围

实施后 taozi 支持 **9 门语言**，全部三件套完整：

| 语言 | reviewer | build-resolver | patterns skill | 状态 |
|------|----------|----------------|----------------|------|
| TypeScript/Node.js | ✅ 已有 | ✅ 已有 | ✅ 已有 | 完整 |
| Python | ✅ 已有 | 🆕 新增 | ✅ 已有 (+django) | 补齐 |
| Go | ✅ 已有 | 🆕 新增 | ✅ 已有 | 补齐 |
| Java | ✅ 已有 | 🆕 新增 | ✅ 已有 (+springboot) | 补齐 |
| Rust | 🆕 新增 | 🆕 新增 | 🆕 新增 | 全新 |
| Kotlin | 🆕 新增 | 🆕 新增 | 🆕 新增 | 全新 |
| C++ | 🆕 新增 | 🆕 新增 | 🆕 新增 | 全新 |
| C# (.NET) | 🆕 新增 | 🆕 新增 | 🆕 新增 | 全新 |
| Flutter/Dart | 🆕 新增 | 🆕 新增 | 🆕 新增 | 全新 |

---

## 文件清单

### 新增 agents（13 个）

```
agents/python-build-resolver.md
agents/go-build-resolver.md
agents/java-build-resolver.md
agents/rust-reviewer.md
agents/rust-build-resolver.md
agents/kotlin-reviewer.md
agents/kotlin-build-resolver.md
agents/cpp-reviewer.md
agents/cpp-build-resolver.md
agents/csharp-reviewer.md
agents/csharp-build-resolver.md
agents/flutter-reviewer.md
agents/flutter-build-resolver.md
```

### 新增 skills（5 个）

```
skills/rust-patterns/SKILL.md
skills/kotlin-patterns/SKILL.md
skills/cpp-patterns/SKILL.md
skills/csharp-patterns/SKILL.md
skills/flutter-patterns/SKILL.md
```

### 更新现有文件（2 个）

- `agents/build-error-resolver.md` — description 更新为"TypeScript/Node.js 构建错误修复专家"，避免误导其他语言用户
- `agents/fullstack-developer.md` — 后端覆盖范围加入 Rust、Kotlin；移动端加入 Flutter/Dart

---

## 每语言重点设计

### Python build-resolver
- 工具链：`pip`、`uv`、`poetry`、`pytest`
- 常见错误：`ModuleNotFoundError`、`ImportError`、`IndentationError`、类型注解不兼容（mypy）
- 虚拟环境问题：venv/conda 激活状态检测

### Go build-resolver
- 工具链：`go build`、`go mod tidy`、`go vet`
- 常见错误：`undefined`、`cannot use X as type Y`、module path 不一致、循环 import
- 特殊处理：`go.sum` 校验失败、CGO 编译问题

### Java build-resolver
- 工具链：`mvn`、`gradle`、`javac`
- 常见错误：`cannot find symbol`、版本不兼容、依赖冲突（dependency hell）
- 框架层：Spring Boot 启动失败、Bean 注入失败

### Rust reviewer
- 聚焦：unsafe 块合规性、所有权/生命周期反模式、async 阻塞
- 工具链：`cargo clippy`、`cargo audit`、`cargo fmt`
- CRITICAL：无 `// SAFETY:` 注释的 unsafe、生产路径 `unwrap()`

### Rust build-resolver
- 工具链：`cargo build`、`cargo check`、`cargo fix`
- 常见错误：生命周期标注缺失、借用冲突、trait 未实现、feature flag 缺失
- 特殊：`Cargo.lock` 冲突、交叉编译目标缺失

### Kotlin reviewer
- 聚焦：协程泄漏、null safety 绕过（`!!`滥用）、Java 互操作陷阱
- 工具链：`ktlint`、`detekt`
- CRITICAL：`!!` 在生产路径、`GlobalScope` 协程、blocking in coroutine

### Kotlin build-resolver
- 工具链：`./gradlew build`、`kotlinc`
- 常见错误：Kotlin/JVM 版本不兼容、kapt 注解处理失败、Compose 编译器版本不匹配

### C++ reviewer
- 聚焦：内存安全（raw pointer、UAF、double-free）、UB（undefined behavior）、RAII 违反
- 工具链：`clang-tidy`、`cppcheck`、`valgrind`
- CRITICAL：raw `new`/`delete`（应用 smart pointer）、无边界检查的数组访问

### C++ build-resolver
- 工具链：`cmake`、`make`、`ninja`、`clang++`/`g++`
- 常见错误：头文件找不到、链接错误（undefined reference）、模板实例化失败、ABI 不兼容

### C# reviewer
- 聚焦：async/await 死锁（`.Result`/`.Wait()` blocking）、IDisposable 泄漏、LINQ 延迟求值陷阱
- 工具链：`dotnet build`、Roslyn analyzer、`dotnet format`
- CRITICAL：`async void`（非事件处理器）、未 dispose 的 DbContext

### C# build-resolver
- 工具链：`dotnet build`、`dotnet restore`、`nuget`
- 常见错误：NuGet 依赖冲突、目标框架不兼容、缺少 `using` 声明、生成代码不同步（EF migrations）

### Flutter/Dart reviewer
- 聚焦：Widget 重建性能（`const` 缺失）、State 管理反模式、Dart null safety 绕过
- 工具链：`flutter analyze`、`dart fix`
- CRITICAL：`BuildContext` 跨 async gap 使用、`setState` 在 dispose 后调用

### Flutter build-resolver
- 工具链：`flutter build`、`flutter pub get`、`dart pub`
- 常见错误：pubspec 版本冲突、native plugin 编译失败（Android/iOS）、Dart SDK 版本不兼容

---

## 同步要求

所有新增 `agents/*.md` 和 `skills/*/SKILL.md` 完成后必须运行：

```bash
node scripts/sync-codex.js
```

确保 Codex 侧同步更新。

---

## 验证标准

- `node tests/run-all.js` 全部通过
- 每个新 agent 的 frontmatter 格式正确（平层 key: value）
- `npm run lint` 通过（hooks.json 格式合法）
- sync-codex 运行后无 diff 残留
