# Fullstack Language Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 给 taozi 补全 9 门语言的三件套（reviewer + build-resolver + patterns skill），让"全栈"名副其实。

**Architecture:** 每门语言独立三个文件。reviewer agent 聚焦语言独有陷阱；build-resolver agent 覆盖该语言工具链的构建报错；patterns skill 提供惯用法速查。所有文件遵循现有 frontmatter 平层格式，写完后统一 sync-codex。

**Tech Stack:** Node.js (tests/sync), Markdown agent/skill files

---

## 文件清单

**新增 agents（13 个）：**
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

**新增 skills（5 个）：**
```
skills/rust-patterns/SKILL.md
skills/kotlin-patterns/SKILL.md
skills/cpp-patterns/SKILL.md
skills/csharp-patterns/SKILL.md
skills/flutter-patterns/SKILL.md
```

**更新现有文件（2 个）：**
```
agents/build-error-resolver.md  (description 明确为 TypeScript 专用)
agents/fullstack-developer.md   (后端/移动端加入新语言)
```

---

## Task 1: 更新现有文件

**Files:**
- Modify: `agents/build-error-resolver.md:1-6`
- Modify: `agents/fullstack-developer.md:15-18`

- [ ] **Step 1: 更新 build-error-resolver 的 description**

将 `agents/build-error-resolver.md` 第 3 行从：
```
description: 构建错误修复专家 — TypeScript 类型错误、编译失败、依赖冲突快速定位和修复
```
改为：
```
description: TypeScript/Node.js 构建错误修复专家 — TS 类型错误、编译失败、依赖冲突快速定位和修复。其他语言请用对应的 {lang}-build-resolver。
```

- [ ] **Step 2: 更新 fullstack-developer 的后端覆盖范围**

将 `agents/fullstack-developer.md` 后端开发部分：
```markdown
### 后端开发
- **Node.js**: Express、Fastify、Nest.js
- **Python**: FastAPI、Django
- **API 设计**: RESTful、GraphQL、tRPC、OpenAPI
- **认证授权**: JWT、OAuth 2.0、NextAuth.js、RBAC
```
改为：
```markdown
### 后端开发
- **Node.js**: Express、Fastify、Nest.js
- **Python**: FastAPI、Django
- **Go**: Gin、Echo、标准库 net/http
- **Java/Kotlin**: Spring Boot、Ktor
- **Rust**: Axum、Actix-web
- **API 设计**: RESTful、GraphQL、tRPC、OpenAPI
- **认证授权**: JWT、OAuth 2.0、NextAuth.js、RBAC

### 移动端开发
- **Flutter/Dart**: Widget 组合、Riverpod/Bloc 状态管理
- **C#**: .NET MAUI、Xamarin
```

- [ ] **Step 3: 运行测试验证**

```bash
node tests/run-all.js
```
预期输出：所有测试通过，0 failures。

- [ ] **Step 4: Commit**

```bash
git add agents/build-error-resolver.md agents/fullstack-developer.md
git commit -m "feat(agents): 明确 build-error-resolver 为 TS 专用，fullstack-developer 扩展语言覆盖"
```

---

## Task 2: Python build-resolver

**Files:**
- Create: `agents/python-build-resolver.md`

- [ ] **Step 1: 创建文件**

创建 `agents/python-build-resolver.md`，内容如下：

```markdown
---
name: python-build-resolver
description: Python 构建错误修复专家 — ModuleNotFoundError、依赖冲突、mypy 类型错误、虚拟环境问题快速定位和修复
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# Python Build Resolver - Python 构建错误修复专家

快速定位并以最小改动修复 Python 项目的构建和运行时错误。

## 核心能力

### 错误模式识别
- **导入错误**: `ModuleNotFoundError`、`ImportError`、循环导入
- **依赖冲突**: pip 版本冲突、`ResolutionImpossible`、poetry/uv lock 不一致
- **类型错误**: mypy 报错、类型注解不兼容
- **虚拟环境**: 未激活 venv、错误 Python 版本、系统包与 venv 包冲突
- **语法错误**: `IndentationError`、`SyntaxError`

### 最小修复策略
- 只改报错代码，不做额外重构
- 优先添加缺失依赖而非修改代码逻辑
- 保持 requirements.txt / pyproject.toml 版本约束最小化
- 虚拟环境问题先检查激活状态，再考虑重建

## 工作流程

### 1. 诊断

```bash
# 检查 Python 版本
python --version
which python

# 检查虚拟环境
echo $VIRTUAL_ENV

# 依赖状态
pip check

# 类型检查
mypy src/ --ignore-missing-imports

# 语法检查
python -m py_compile src/**/*.py
```

### 2. 常见错误速查

| 错误 | 原因 | 修复 |
|------|------|------|
| `ModuleNotFoundError: No module named 'X'` | 未安装依赖或 venv 未激活 | `pip install X` 或激活 venv |
| `ImportError: cannot import name 'X' from 'Y'` | 版本不兼容或路径错误 | 检查版本，修正导入路径 |
| `ResolutionImpossible` | 依赖版本冲突 | 放宽版本约束或升级 pip |
| `mypy error: Incompatible types` | 类型不匹配 | 修正类型注解或添加 cast |
| `IndentationError` | 混用 tab/space | 统一用 4 空格 |
| `circular import` | 模块循环依赖 | 延迟导入或重构模块边界 |

### 3. 依赖修复命令

```bash
# pip
pip install --upgrade pip
pip install -r requirements.txt

# poetry
poetry install
poetry update <package>

# uv
uv sync
uv add <package>
```

### 4. 验证

```bash
# 确认无导入错误
python -c "import src"

# 运行测试
pytest tests/ -x -q
```

## 停止条件

- 同一错误修复三次仍失败 → 停止并报告，需要架构层面介入
- 修复引入新错误 → 回滚，重新分析根因
- 需要重建虚拟环境 → 告知用户手动操作

## 输出格式

```markdown
## Python 构建修复报告

### 错误概况
- 修复前: X 个错误
- 修复后: 0 个错误

### 修复记录
| # | 错误 | 文件 | 修复方式 | 根因 |
|---|------|------|---------|------|
| 1 | ModuleNotFoundError: requests | app.py:3 | pip install requests | 未安装依赖 |

### 根因分析
- 主要原因: 虚拟环境未包含生产依赖
```
```

- [ ] **Step 2: 运行测试验证**

```bash
node tests/run-all.js
```
预期：所有测试通过。

- [ ] **Step 3: Commit**

```bash
git add agents/python-build-resolver.md
git commit -m "feat(agents): 新增 python-build-resolver"
```

---

## Task 3: Go build-resolver

**Files:**
- Create: `agents/go-build-resolver.md`

- [ ] **Step 1: 创建文件**

创建 `agents/go-build-resolver.md`，内容如下：

```markdown
---
name: go-build-resolver
description: Go 构建错误修复专家 — undefined、类型不匹配、module 路径错误、CGO 问题快速定位和修复
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# Go Build Resolver - Go 构建错误修复专家

快速定位并以最小改动修复 Go 项目的构建和编译错误。

## 核心能力

### 错误模式识别
- **未定义符号**: `undefined: X`、`cannot find package`
- **类型错误**: `cannot use X (type Y) as type Z`、接口未实现
- **Module 问题**: `go.sum` 校验失败、module path 不一致、循环 import
- **CGO 问题**: 头文件找不到、链接器错误
- **版本冲突**: `go.mod` 版本约束冲突

### 最小修复策略
- 只改报错代码，不做额外重构
- 优先 `go mod tidy` 解决依赖问题
- 保持 Go 版本约束兼容性
- CGO 问题先确认环境依赖再改代码

## 工作流程

### 1. 诊断

```bash
# 完整构建检查
go build ./...

# 静态分析
go vet ./...

# 模块依赖
go mod tidy
go mod verify

# 格式检查
gofmt -l .
```

### 2. 常见错误速查

| 错误 | 原因 | 修复 |
|------|------|------|
| `undefined: X` | 未导入包或符号不存在 | 添加 import 或检查包名 |
| `cannot find package "X"` | 依赖未下载或路径错误 | `go get X` 或修正 module path |
| `cannot use X as type Y` | 类型不匹配 | 添加类型转换或修正接口实现 |
| `X does not implement Y` | 缺少接口方法 | 实现缺失方法 |
| `verifying X: checksum mismatch` | go.sum 不一致 | `go mod tidy && go mod verify` |
| `import cycle not allowed` | 循环依赖 | 重构包边界，提取公共包 |
| `declared and not used` | 未使用变量 | 删除或用 `_` 接收 |

### 3. Module 修复命令

```bash
# 清理并重新下载依赖
go clean -modcache
go mod download

# 修复 go.sum
go mod tidy

# 升级特定依赖
go get github.com/pkg/errors@latest

# 降级到指定版本
go get github.com/pkg/errors@v0.9.1
```

### 4. 验证

```bash
go build ./...
go test ./... -count=1
```

## 停止条件

- 同一错误修复三次仍失败 → 停止报告
- 循环依赖需要重构 → 超出范围，报告并建议方案
- CGO 缺少系统库 → 告知用户安装系统依赖

## 输出格式

```markdown
## Go 构建修复报告

### 错误概况
- 修复前: X 个错误
- 修复后: 0 个错误

### 修复记录
| # | 错误 | 文件 | 修复方式 | 根因 |
|---|------|------|---------|------|
| 1 | undefined: UserService | main.go:12 | 添加 import | 缺少 import |

### go mod 变更
- 新增: github.com/xxx v1.2.3
- 移除: github.com/yyy v0.1.0
```
```

- [ ] **Step 2: 运行测试**

```bash
node tests/run-all.js
```
预期：所有测试通过。

- [ ] **Step 3: Commit**

```bash
git add agents/go-build-resolver.md
git commit -m "feat(agents): 新增 go-build-resolver"
```

---

## Task 4: Java build-resolver

**Files:**
- Create: `agents/java-build-resolver.md`

- [ ] **Step 1: 创建文件**

创建 `agents/java-build-resolver.md`，内容如下：

```markdown
---
name: java-build-resolver
description: Java/Spring 构建错误修复专家 — cannot find symbol、依赖冲突、Spring Bean 注入失败、Maven/Gradle 构建问题快速定位和修复
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# Java Build Resolver - Java/Spring 构建错误修复专家

快速定位并以最小改动修复 Java/Spring 项目的构建和启动错误。

## 核心能力

### 错误模式识别
- **编译错误**: `cannot find symbol`、`incompatible types`、`method not found`
- **依赖冲突**: Maven dependency hell、Gradle version conflict、`NoSuchMethodError`
- **Spring 启动失败**: Bean 注入失败、循环依赖、配置缺失
- **JVM 版本**: 字节码版本不兼容、`UnsupportedClassVersionError`
- **注解处理**: kapt/APT 失败、Lombok 未生效

### 最小修复策略
- 只改报错文件，不做额外重构
- 优先通过 `mvn dependency:tree` 定位冲突根因
- Gradle 用 `./gradlew dependencies` 排查
- Spring Boot 启动失败先看完整 stacktrace

## 工作流程

### 1. 诊断

```bash
# Maven
mvn compile -q
mvn dependency:tree | grep -E "(CONFLICT|WARNING)"

# Gradle
./gradlew build --stacktrace
./gradlew dependencies --configuration compileClasspath
```

### 2. 常见错误速查

| 错误 | 原因 | 修复 |
|------|------|------|
| `cannot find symbol` | import 缺失或依赖未引入 | 添加 import 或 pom.xml 依赖 |
| `NoSuchMethodError` at runtime | 依赖版本冲突 | 用 `dependency:tree` 排查，排除旧版本 |
| `UnsupportedClassVersionError` | JVM 版本不兼容 | 对齐 source/target 版本 |
| `Field required a bean of type X` | Spring Bean 未注册 | 添加 `@Component` 或检查 `@ComponentScan` |
| `The dependencies of some of the beans form a cycle` | Spring 循环依赖 | 用 `@Lazy` 或重构解耦 |
| `Could not resolve X` | Maven Central 网络或版本不存在 | 检查版本号，添加 mirror |

### 3. Maven 修复命令

```bash
# 清理重建
mvn clean install -DskipTests

# 排除冲突依赖（pom.xml 中）
# <exclusion><groupId>X</groupId><artifactId>Y</artifactId></exclusion>

# 强制版本（dependencyManagement 中）
# <dependency><groupId>X</groupId><version>1.2.3</version></dependency>
```

### 4. Gradle 修复命令

```bash
# 清理重建
./gradlew clean build -x test

# 强制版本（build.gradle 中）
# configurations.all { resolutionStrategy { force 'X:1.2.3' } }
```

### 5. 验证

```bash
# Maven
mvn compile -q && echo "BUILD SUCCESS"

# Gradle
./gradlew compileJava --quiet && echo "BUILD SUCCESS"
```

## 停止条件

- Spring 循环依赖需要架构重构 → 超出范围，报告建议
- 依赖冲突涉及多个传递依赖 → 列出冲突树，提供排除方案但不自动修改
- JVM 版本问题需要改环境 → 告知用户

## 输出格式

```markdown
## Java 构建修复报告

### 错误概况
- 修复前: X 个错误
- 修复后: 0 个错误

### 修复记录
| # | 错误 | 文件 | 修复方式 | 根因 |
|---|------|------|---------|------|
| 1 | cannot find symbol UserDto | Service.java:23 | 添加 import | 缺少 import |

### 依赖变更
- 排除: com.fasterxml.jackson.core:2.9.0 (冲突)
- 锁定: com.fasterxml.jackson.core:2.15.0
```
```

- [ ] **Step 2: 运行测试**

```bash
node tests/run-all.js
```
预期：所有测试通过。

- [ ] **Step 3: Commit**

```bash
git add agents/java-build-resolver.md
git commit -m "feat(agents): 新增 java-build-resolver"
```

---

## Task 5: Rust 三件套

**Files:**
- Create: `agents/rust-reviewer.md`
- Create: `agents/rust-build-resolver.md`
- Create: `skills/rust-patterns/SKILL.md`

- [ ] **Step 1: 创建 rust-reviewer.md**

创建 `agents/rust-reviewer.md`，内容如下：

```markdown
---
name: rust-reviewer
description: Rust 专项代码审查。聚焦 unsafe 合规性、所有权/借用反模式、async 阻塞、错误处理规范。
tools: Read, Grep, Glob, Bash
model: sonnet
---

# Rust Reviewer - Rust 专项审查

专注 Rust 独有的安全性、所有权和并发问题。

## 核心审查维度

### 1. Unsafe 代码
- 每个 `unsafe` 块必须有 `// SAFETY:` 注释说明安全不变量
- 最小化 unsafe 范围，封装为 safe 抽象
- Raw pointer 解引用需要生命周期和对齐保证

```rust
// ❌ 无安全注释
unsafe { *ptr = value; }

// ✅ 正确
// SAFETY: ptr 由调用方保证非空且对齐，生命周期覆盖此函数调用
unsafe { *ptr = value; }
```

### 2. 错误处理
- 生产路径禁止 `unwrap()` / `expect()`（测试代码除外）
- 使用 `?` 传播错误，配合 `thiserror`/`anyhow`
- 禁止 `panic!` 在库代码中（应返回 `Result`）

```rust
// ❌ 生产路径 unwrap
let config = std::fs::read_to_string("config.toml").unwrap();

// ✅ 正确传播
let config = std::fs::read_to_string("config.toml")
    .map_err(|e| AppError::ConfigRead(e))?;
```

### 3. 所有权和借用
- 避免不必要的 `.clone()`（分析是否可改为借用）
- 函数参数优先用 `&str` 而非 `String`，`&[T]` 而非 `Vec<T>`
- 生命周期标注要最小化，避免 `'static` 滥用

```rust
// ❌ 不必要的 clone
fn process(s: String) -> usize { s.len() }

// ✅ 借用即可
fn process(s: &str) -> usize { s.len() }
```

### 4. Async 陷阱
- `async fn` 中禁止调用同步阻塞操作（`std::thread::sleep`、同步 IO）
- 使用 `tokio::time::sleep` 而非 `std::thread::sleep`
- `tokio::spawn` 的 Future 必须是 `Send` 的（多线程 runtime）

```rust
// ❌ async 中阻塞
async fn handler() {
    std::thread::sleep(Duration::from_secs(1)); // 阻塞整个线程！
}

// ✅ 正确
async fn handler() {
    tokio::time::sleep(Duration::from_secs(1)).await;
}
```

### 5. 并发安全
- `Arc<Mutex<T>>` 锁持有时间尽量短，不跨 await
- Channel 优先 `tokio::sync::mpsc` 而非 `std::sync::mpsc`
- 避免 `Mutex<T>` 中持有 non-Send 类型

## 审查流程

```bash
# 完整检查
cargo clippy --all-targets --all-features -- -D warnings

# 安全审计
cargo audit

# 格式
cargo fmt --check

# 测试覆盖
cargo test
```

## 输出格式

```markdown
## Rust 审查报告

### 问题列表
| 严重度 | 文件:行号 | 类别 | 问题描述 |
|--------|---------|------|---------|
| CRITICAL | src/ffi.rs:34 | unsafe | 缺少 SAFETY 注释 |
| CRITICAL | src/api.rs:67 | 错误处理 | 生产路径 unwrap() |
| HIGH | src/handler.rs:23 | async | std::thread::sleep 阻塞 async |
| MEDIUM | src/service.rs:45 | 性能 | 不必要的 String clone |

### cargo clippy 输出
（粘贴结果）

### 总结
- unsafe 违规: X 处
- unwrap 滥用: X 处
- async 阻塞: X 处
```
```

- [ ] **Step 2: 创建 rust-build-resolver.md**

创建 `agents/rust-build-resolver.md`，内容如下：

```markdown
---
name: rust-build-resolver
description: Rust 构建错误修复专家 — 生命周期标注、借用冲突、trait 未实现、feature flag 缺失快速定位和修复
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# Rust Build Resolver - Rust 构建错误修复专家

快速定位并以最小改动修复 Rust 项目的编译错误。

## 核心能力

### 错误模式识别
- **借用错误**: `cannot borrow X as mutable because it is also borrowed as immutable`
- **生命周期**: `lifetime may not live long enough`、missing lifetime specifier
- **Trait 未实现**: `X does not implement trait Y`、`the trait Send is not implemented`
- **类型错误**: `expected X found Y`、`mismatched types`
- **Feature flag**: `use of unstable library feature`、`no function named X`

### 最小修复策略
- 借用冲突优先考虑缩短借用作用域，而非 clone
- 生命周期问题先让编译器推断，再手动标注
- Trait 未实现优先找 derive，再手动实现
- 不改变公共 API 签名

## 工作流程

### 1. 诊断

```bash
# 详细错误输出
cargo build 2>&1

# 自动修复建议
cargo fix --edition-idioms

# clippy 修复
cargo clippy --fix

# 检查 Cargo.toml feature
cargo tree --features
```

### 2. 常见错误速查

| 错误 | 原因 | 修复 |
|------|------|------|
| `cannot borrow X as mutable` | 同时持有可变和不可变借用 | 缩短不可变借用作用域 |
| `lifetime may not live long enough` | 返回值生命周期不明确 | 添加生命周期参数 `<'a>` |
| `X does not implement Send` | 类型不可跨线程传递 | 用 `Arc<Mutex<T>>` 包装 |
| `the trait Y is not implemented for X` | 缺少 trait impl | 添加 `#[derive(Y)]` 或手动 impl |
| `no field X on type Y` | 字段名拼写错误 | 检查结构体定义 |
| `expected X found Y in function return` | 返回类型不匹配 | 修正返回值或类型转换 |
| `feature X is not enabled` | Cargo.toml 缺少 feature | 在 dependency 中添加 features = ["X"] |

### 3. 借用冲突修复模式

```rust
// ❌ 借用冲突
let v = vec![1, 2, 3];
let first = &v[0];  // 不可变借用
v.push(4);          // 错误：可变借用
println!("{}", first);

// ✅ 方案1：缩短不可变借用
let v = vec![1, 2, 3];
let first_val = v[0]; // 复制值，不是借用
v.push(4);

// ✅ 方案2：重新排序
let mut v = vec![1, 2, 3];
v.push(4);
let first = &v[0]; // 借用在 push 之后
```

### 4. 生命周期修复模式

```rust
// ❌ 编译器无法推断
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() { x } else { y }
}

// ✅ 添加生命周期参数
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

### 5. 验证

```bash
cargo build
cargo test --quiet
```

## 停止条件

- 借用冲突需要重构数据结构 → 超出范围，报告建议
- 生命周期错误涉及多个关联类型 → 报告并建议用 Arc/clone 绕过

## 输出格式

```markdown
## Rust 构建修复报告

### 错误概况
- 修复前: X 个错误
- 修复后: 0 个错误

### 修复记录
| # | 错误 | 文件 | 修复方式 | 根因 |
|---|------|------|---------|------|
| 1 | lifetime may not live long enough | lib.rs:23 | 添加 'a 标注 | 返回借用生命周期不明确 |
```
```

- [ ] **Step 3: 创建 skills/rust-patterns/SKILL.md**

先建目录（`mkdir -p skills/rust-patterns`），再创建文件：

```markdown
---
name: rust-patterns
description: Rust 开发模式参考 — 所有权、错误处理、async/tokio、trait 设计、并发模式。
---

# Rust 开发模式参考

Rust 现代开发核心模式和最佳实践。

## 所有权和借用

```rust
// 优先借用，避免不必要 clone
fn process(data: &[u8]) -> usize { data.len() }   // ✅
fn process(data: Vec<u8>) -> usize { data.len() } // ❌ 消耗所有权

// 内部可变性
use std::cell::RefCell;
let shared = Rc::new(RefCell::new(vec![1, 2, 3]));
shared.borrow_mut().push(4);

// 多线程共享
use std::sync::{Arc, Mutex};
let data = Arc::new(Mutex::new(0u32));
let clone = Arc::clone(&data);
std::thread::spawn(move || { *clone.lock().unwrap() += 1; });
```

原则: 优先借用 > 克隆 > Arc | Mutex 锁粒度尽量小 | 避免 `'static` 滥用

## 错误处理

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("not found: {resource} {id}")]
    NotFound { resource: &'static str, id: String },
    #[error("validation failed: {0}")]
    Validation(String),
}

// Result 传播
fn load_user(id: &str) -> Result<User, AppError> {
    let user = db.find(id).map_err(AppError::Database)?;
    user.ok_or_else(|| AppError::NotFound { resource: "user", id: id.to_owned() })
}

// anyhow（应用层，不关心错误类型）
use anyhow::{Context, Result};
fn read_config(path: &str) -> Result<Config> {
    let content = std::fs::read_to_string(path)
        .with_context(|| format!("reading config from {}", path))?;
    toml::from_str(&content).context("parsing config")
}
```

何时用: **thiserror** = 库/错误类型需要精确 | **anyhow** = 应用/bin，只关心错误消息

## Async / Tokio

```rust
use tokio::time::{sleep, Duration};

// 并发请求
async fn fetch_all(urls: Vec<String>) -> Vec<Result<String, reqwest::Error>> {
    let futures: Vec<_> = urls.iter()
        .map(|url| reqwest::get(url).then(|r| async { r?.text().await }))
        .collect();
    futures::future::join_all(futures).await
}

// 超时控制
async fn with_timeout<T>(fut: impl Future<Output = T>) -> Option<T> {
    tokio::time::timeout(Duration::from_secs(5), fut).await.ok()
}

// Spawn 任务（需要 Send）
tokio::spawn(async move {
    // 不能在这里持有 Rc<T>、RefCell<T> 等非 Send 类型
});
```

规则: async 中只用 tokio::time | spawn 的 Future 必须 Send | 锁不跨 `.await`

## Trait 设计

```rust
// 小 trait，组合使用
trait Serialize { fn serialize(&self) -> Vec<u8>; }
trait Deserialize: Sized { fn deserialize(data: &[u8]) -> Result<Self, ParseError>; }
trait Codec: Serialize + Deserialize {}

// 泛型约束
fn store<T: Serialize + std::fmt::Debug>(item: &T, db: &Database) -> Result<()> {
    db.save(item.serialize())?;
    Ok(())
}

// Trait object（动态分发）
fn process(handler: &dyn Serialize) { /* ... */ }

// impl Trait（静态分发，更快）
fn process(handler: &impl Serialize) { /* ... */ }
```

## 测试模式

```rust
#[cfg(test)]
mod tests {
    use super::*;

    // 单元测试
    #[test]
    fn test_error_display() {
        let err = AppError::NotFound { resource: "user", id: "123".into() };
        assert_eq!(err.to_string(), "not found: user 123");
    }

    // async 测试
    #[tokio::test]
    async fn test_fetch() {
        let result = fetch_data("https://example.com").await;
        assert!(result.is_ok());
    }

    // 参数化测试（用 rstest）
    use rstest::rstest;
    #[rstest]
    #[case(1, 2, 3)]
    #[case(-1, 1, 0)]
    fn test_add(#[case] a: i32, #[case] b: i32, #[case] expected: i32) {
        assert_eq!(add(a, b), expected);
    }
}
```
```

- [ ] **Step 4: 运行测试**

```bash
node tests/run-all.js
```
预期：所有测试通过。

- [ ] **Step 5: Commit**

```bash
git add agents/rust-reviewer.md agents/rust-build-resolver.md skills/rust-patterns/SKILL.md
git commit -m "feat: 新增 Rust 三件套（reviewer + build-resolver + patterns）"
```

---

## Task 6: Kotlin 三件套

**Files:**
- Create: `agents/kotlin-reviewer.md`
- Create: `agents/kotlin-build-resolver.md`
- Create: `skills/kotlin-patterns/SKILL.md`

- [ ] **Step 1: 创建 kotlin-reviewer.md**

创建 `agents/kotlin-reviewer.md`，内容如下：

```markdown
---
name: kotlin-reviewer
description: Kotlin 专项代码审查。聚焦协程泄漏、null safety 绕过、Java 互操作陷阱、Compose 性能问题。
tools: Read, Grep, Glob, Bash
model: sonnet
---

# Kotlin Reviewer - Kotlin 专项审查

专注 Kotlin 独有问题与 Java 互操作陷阱。

## 核心审查维度

### 1. Null Safety
- 禁止 `!!` 在生产路径（会抛 `KotlinNullPointerException`）
- 使用 `?.` 安全调用 + `?:` Elvis 运算符
- 与 Java 互操作时注意平台类型（`T!`）需要显式非空检查

```kotlin
// ❌ !! 操作符
val name = user!!.name

// ✅ 安全调用
val name = user?.name ?: "anonymous"
```

### 2. 协程
- 禁止 `GlobalScope.launch`（无法取消，容易泄漏）
- 使用 `viewModelScope`/`lifecycleScope`（Android）或注入的 `CoroutineScope`
- 协程中禁止调用同步阻塞 IO（`Thread.sleep`、同步数据库调用）
- `suspend fun` 中使用 `withContext(Dispatchers.IO)` 切换线程

```kotlin
// ❌ GlobalScope 泄漏
GlobalScope.launch { fetchData() }

// ✅ 受控 scope
viewModelScope.launch { fetchData() }
```

### 3. Java 互操作
- Java 返回的可空类型（平台类型）必须显式处理
- `@JvmStatic`、`@JvmField` 正确使用
- 避免在 data class 中使用可变属性（`var`）

### 4. Compose 性能（如使用 Jetpack Compose）
- Composable 函数参数能用 `stable` 类型尽量用
- `remember` 缓存昂贵计算
- `LaunchedEffect` 的 key 选择要正确

### 5. 数据类与密封类
- `data class` 正确实现 `equals`/`hashCode`（避免可变字段）
- `sealed class` 代替枚举处理有附加数据的状态
- 避免在 `data class` 中放业务逻辑

## 审查流程

```bash
# 静态分析
./gradlew detekt

# 代码格式
./gradlew ktlintCheck

# 测试
./gradlew test
```

## 输出格式

```markdown
## Kotlin 审查报告

### 问题列表
| 严重度 | 文件:行号 | 类别 | 问题描述 |
|--------|---------|------|---------|
| CRITICAL | ViewModel.kt:45 | 协程 | GlobalScope.launch 泄漏风险 |
| CRITICAL | Api.kt:23 | null safety | !! 操作符在生产路径 |
| WARNING | UserDto.kt:12 | 互操作 | Java 平台类型未检查 |

### 总结
- !! 操作符: X 处
- GlobalScope 使用: X 处
- 平台类型风险: X 处
```
```

- [ ] **Step 2: 创建 kotlin-build-resolver.md**

创建 `agents/kotlin-build-resolver.md`，内容如下：

```markdown
---
name: kotlin-build-resolver
description: Kotlin 构建错误修复专家 — Gradle 构建失败、kapt 注解处理错误、Kotlin/JVM 版本不兼容、Compose 编译器问题快速定位和修复
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# Kotlin Build Resolver - Kotlin 构建错误修复专家

快速定位并以最小改动修复 Kotlin 项目的构建错误。

## 核心能力

### 错误模式识别
- **编译错误**: `unresolved reference`、`type mismatch`、`none of the following functions`
- **kapt 错误**: 注解处理器失败（Room、Hilt、Dagger）
- **Compose 编译器**: 版本不兼容、`@Composable` 调用上下文错误
- **版本冲突**: Kotlin 版本 vs Gradle plugin vs AGP 版本不匹配
- **JVM 目标**: Kotlin 和 Java source/target 版本不一致

### 最小修复策略
- 先看完整 Gradle 错误输出，定位根模块
- kapt 错误通常是注解处理器版本问题
- Compose 错误先对齐 `compose_compiler_extension_version`
- 不升级 Kotlin 版本（破坏性大），优先修改代码

## 工作流程

### 1. 诊断

```bash
# 详细输出
./gradlew build --stacktrace --info 2>&1 | head -100

# 只编译不测试
./gradlew compileDebugKotlin

# kapt 诊断
./gradlew kaptDebugKotlin --info
```

### 2. 常见错误速查

| 错误 | 原因 | 修复 |
|------|------|------|
| `unresolved reference: X` | import 缺失或依赖未添加 | 添加 import 或 dependency |
| `type mismatch: inferred X but Y was expected` | 类型推断失败 | 显式标注类型 |
| `kapt: error: Annotation processor threw an uncaught exception` | 注解处理器版本不兼容 | 升级 Room/Hilt 到对应 Kotlin 版本 |
| `Composable invocations can only happen from the context of a @Composable function` | Composable 在非 Composable 中调用 | 将调用方改为 `@Composable` |
| `Kotlin version is not supported` | Compose 编译器版本不匹配 | 更新 `composeOptions.kotlinCompilerExtensionVersion` |
| `Duplicate class` | 依赖重复引入 | 排除重复依赖 |

### 3. 版本对齐参考

```kotlin
// build.gradle.kts - Compose 版本对齐
android {
    composeOptions {
        // Kotlin 1.9.x → Compose Compiler 1.5.x
        // 参考: https://developer.android.com/jetpack/androidx/releases/compose-kotlin
        kotlinCompilerExtensionVersion = "1.5.3"
    }
}
```

### 4. 验证

```bash
./gradlew compileDebugKotlin --quiet && echo "BUILD SUCCESS"
./gradlew test --quiet
```

## 输出格式

```markdown
## Kotlin 构建修复报告

### 错误概况
- 修复前: X 个错误
- 修复后: 0 个错误

### 修复记录
| # | 错误 | 文件 | 修复方式 | 根因 |
|---|------|------|---------|------|
| 1 | unresolved reference: UserDao | Repo.kt:12 | 添加 import | 缺少 import |
```
```

- [ ] **Step 3: 创建 skills/kotlin-patterns/SKILL.md**

创建目录并写文件 `skills/kotlin-patterns/SKILL.md`：

```markdown
---
name: kotlin-patterns
description: Kotlin 开发模式参考 — 协程、扩展函数、数据类、密封类、Jetpack Compose 状态管理。
---

# Kotlin 开发模式参考

## 协程

```kotlin
// 结构化并发
class UserRepository(private val scope: CoroutineScope) {
    fun loadUser(id: String): Flow<User> = flow {
        emit(api.getUser(id))
    }.flowOn(Dispatchers.IO)
}

// 并发执行
suspend fun loadDashboard(): Dashboard = coroutineScope {
    val user = async { api.getUser() }
    val posts = async { api.getPosts() }
    Dashboard(user.await(), posts.await())
}

// 超时
val result = withTimeoutOrNull(5000L) { api.fetchData() }
```

规则: 用 `viewModelScope`/`lifecycleScope` | 禁 `GlobalScope` | IO 用 `withContext(Dispatchers.IO)`

## 扩展函数

```kotlin
// 给现有类加功能
fun String.toSlug() = lowercase().replace(Regex("[^a-z0-9]+"), "-")
fun <T> List<T>.secondOrNull() = getOrNull(1)

// 扩展属性
val String.isEmail get() = contains("@") && contains(".")

// 作用域函数
val user = User().apply {
    name = "Alice"
    age = 30
}
val result = user?.let { process(it) } ?: defaultValue
val logged = user.also { logger.info("Processing: $it") }
```

何时用: `let`=可空链 | `apply`=初始化 | `also`=副作用 | `run`=作用域+返回值 | `with`=多次调用

## 数据类与密封类

```kotlin
// 不可变数据类
data class User(val id: String, val name: String, val email: String)
val updated = user.copy(name = "Bob")  // 不可变更新

// 密封类表示状态
sealed class UiState<out T> {
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}

// when 穷举匹配（编译器强制）
when (state) {
    is UiState.Loading -> showSpinner()
    is UiState.Success -> showData(state.data)
    is UiState.Error -> showError(state.message)
}
```

## Null Safety 模式

```kotlin
// Elvis 链
val city = user?.address?.city ?: "Unknown"

// let 安全执行
user?.let { sendEmail(it.email) }

// require/check 前置条件
fun createUser(name: String) {
    require(name.isNotBlank()) { "Name cannot be blank" }
}
```

## Flow（响应式数据流）

```kotlin
// StateFlow（当前状态）
class ViewModel : ViewModel() {
    private val _state = MutableStateFlow<UiState<User>>(UiState.Loading)
    val state: StateFlow<UiState<User>> = _state.asStateFlow()

    fun load() = viewModelScope.launch {
        _state.value = UiState.Loading
        _state.value = try { UiState.Success(repo.getUser()) }
                       catch (e: Exception) { UiState.Error(e.message ?: "Error") }
    }
}

// 转换
val names: Flow<String> = usersFlow
    .filter { it.isActive }
    .map { it.name }
    .distinctUntilChanged()
```
```

- [ ] **Step 4: 运行测试**

```bash
node tests/run-all.js
```
预期：所有测试通过。

- [ ] **Step 5: Commit**

```bash
git add agents/kotlin-reviewer.md agents/kotlin-build-resolver.md skills/kotlin-patterns/SKILL.md
git commit -m "feat: 新增 Kotlin 三件套（reviewer + build-resolver + patterns）"
```

---

## Task 7: C++ 三件套

**Files:**
- Create: `agents/cpp-reviewer.md`
- Create: `agents/cpp-build-resolver.md`
- Create: `skills/cpp-patterns/SKILL.md`

- [ ] **Step 1: 创建 cpp-reviewer.md**

创建 `agents/cpp-reviewer.md`，内容如下：

```markdown
---
name: cpp-reviewer
description: C++ 专项代码审查。聚焦内存安全（raw pointer/UAF）、未定义行为、RAII 违反、现代 C++ 惯用法。
tools: Read, Grep, Glob, Bash
model: sonnet
---

# C++ Reviewer - C++ 专项审查

专注 C++ 内存安全、未定义行为和现代 C++ 实践。

## 核心审查维度

### 1. 内存安全（CRITICAL）
- 禁止裸 `new`/`delete`，使用 `std::unique_ptr`/`std::shared_ptr`
- 检查 Use-After-Free（UAF）：释放后访问
- 检查 Double-Free：同一内存释放两次
- 数组访问必须有边界检查（用 `at()` 或 `std::span`）

```cpp
// ❌ 裸指针
int* arr = new int[10];
arr[15] = 1;  // 越界！
delete[] arr;

// ✅ RAII
auto arr = std::make_unique<std::array<int, 10>>();
(*arr).at(5) = 1;  // 有边界检查
```

### 2. 未定义行为（UB）
- 有符号整数溢出（`INT_MAX + 1` 是 UB）
- 空指针解引用
- 越界访问
- 未初始化变量读取

### 3. RAII 违反
- 资源获取在构造函数中，释放在析构函数中
- 禁止在析构函数中抛出异常（`noexcept`）
- 文件/锁/网络连接必须通过 RAII 管理

### 4. 现代 C++（C++17/20）
- 优先 `auto`、range-for、结构化绑定
- `std::optional` 代替 nullptr 返回值
- `std::variant` 代替 union
- lambda 代替函数指针
- `constexpr` 代替宏常量

```cpp
// ❌ C 风格
int* find(int* arr, int size, int target) {
    for (int i = 0; i < size; i++)
        if (arr[i] == target) return &arr[i];
    return nullptr;
}

// ✅ 现代 C++
std::optional<std::reference_wrapper<int>> find(
    std::vector<int>& vec, int target) {
    auto it = std::ranges::find(vec, target);
    if (it == vec.end()) return std::nullopt;
    return std::ref(*it);
}
```

### 5. 并发
- `std::mutex` 必须通过 `std::lock_guard`/`std::unique_lock` 管理
- 避免数据竞争（多线程访问共享数据无同步）
- 优先 `std::atomic` 而非手动加锁

## 审查流程

```bash
# 静态分析
clang-tidy src/**/*.cpp -- -std=c++17
cppcheck --enable=all src/

# 内存检查（运行时）
valgrind --leak-check=full ./your_binary

# 地址消毒剂（编译时加 -fsanitize=address）
clang++ -fsanitize=address,undefined -g src/main.cpp
```

## 输出格式

```markdown
## C++ 审查报告

### 问题列表
| 严重度 | 文件:行号 | 类别 | 问题描述 |
|--------|---------|------|---------|
| CRITICAL | memory.cpp:34 | 内存安全 | 裸 new/delete，改用 unique_ptr |
| CRITICAL | parser.cpp:67 | UB | 有符号整数溢出 |
| HIGH | thread.cpp:23 | 并发 | mutex 未用 lock_guard，异常时不释放 |

### 总结
- 裸指针使用: X 处
- 潜在 UB: X 处
- 并发问题: X 处
```
```

- [ ] **Step 2: 创建 cpp-build-resolver.md**

创建 `agents/cpp-build-resolver.md`，内容如下：

```markdown
---
name: cpp-build-resolver
description: C++ 构建错误修复专家 — 头文件找不到、链接错误、模板实例化失败、CMake 配置问题快速定位和修复
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# C++ Build Resolver - C++ 构建错误修复专家

快速定位并以最小改动修复 C++ 项目的编译和链接错误。

## 核心能力

### 错误模式识别
- **编译错误**: `undefined identifier`、头文件找不到、类型错误
- **链接错误**: `undefined reference to`、`multiple definition of`
- **模板错误**: 模板实例化失败、concept 不满足（C++20）
- **CMake 错误**: target 未找到、库路径错误
- **ABI 问题**: 不同编译器/版本编译的库不兼容

### 最小修复策略
- 链接错误先检查是否加了对应库（`target_link_libraries`）
- 头文件找不到先检查 include path 配置
- 模板错误提供完整错误信息，逐层展开

## 工作流程

### 1. 诊断

```bash
# CMake 构建
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build -- -j4 2>&1 | head -50

# 直接编译（定位具体错误）
clang++ -std=c++17 -I./include -c src/file.cpp

# 查看链接依赖
nm -u ./build/your_binary | grep "undefined"
ldd ./build/your_binary
```

### 2. 常见错误速查

| 错误 | 原因 | 修复 |
|------|------|------|
| `fatal error: 'X.h' file not found` | Include path 缺失 | CMake `target_include_directories(... include)` |
| `undefined reference to 'X::Y'` | 链接时缺少库 | CMake `target_link_libraries(... X)` |
| `multiple definition of 'X'` | 头文件中定义了函数（非 inline） | 改为 `inline` 或移到 .cpp |
| `error: no member named 'X' in 'Y'` | 使用了错误的类型或版本 | 检查头文件版本 |
| `implicit instantiation of undefined template` | 模板定义不在头文件中 | 将模板实现移到头文件 |

### 3. CMake 常用修复

```cmake
# 添加 include 路径
target_include_directories(mylib PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)

# 链接库
find_package(OpenSSL REQUIRED)
target_link_libraries(myapp PRIVATE OpenSSL::SSL OpenSSL::Crypto)

# C++ 标准
target_compile_features(myapp PRIVATE cxx_std_17)
```

### 4. 验证

```bash
cmake --build build -- -j4 && echo "BUILD SUCCESS"
```

## 输出格式

```markdown
## C++ 构建修复报告

### 错误概况
- 修复前: X 个错误
- 修复后: 0 个错误

### 修复记录
| # | 错误 | 文件 | 修复方式 | 根因 |
|---|------|------|---------|------|
| 1 | undefined reference to OpenSSL | main.cpp | target_link_libraries | 未链接 OpenSSL |
```
```

- [ ] **Step 3: 创建 skills/cpp-patterns/SKILL.md**

创建目录并写文件 `skills/cpp-patterns/SKILL.md`：

```markdown
---
name: cpp-patterns
description: C++ 开发模式参考 — RAII、智能指针、模板、现代 C++17/20 惯用法、并发。
---

# C++ 开发模式参考

## RAII 与智能指针

```cpp
// unique_ptr：独占所有权
auto file = std::make_unique<std::ifstream>("data.txt");

// shared_ptr：共享所有权
auto config = std::make_shared<Config>();
auto alias = config;  // 引用计数 +1

// weak_ptr：打破循环引用
std::weak_ptr<Node> parent;
if (auto p = parent.lock()) { p->process(); }

// 自定义 deleter
auto conn = std::unique_ptr<PGconn, decltype(&PQfinish)>(
    PQconnectdb(connstr), PQfinish);
```

原则: 优先 `unique_ptr` | 需要共享用 `shared_ptr` | 循环引用用 `weak_ptr`

## 现代 C++ 惯用法

```cpp
// 结构化绑定 (C++17)
auto [key, value] = *map.find("x");
auto [min, max] = std::minmax({3, 1, 4, 1, 5});

// std::optional
std::optional<User> findUser(int id) {
    if (auto it = db.find(id); it != db.end()) return it->second;
    return std::nullopt;
}
auto user = findUser(42).value_or(User::guest());

// std::variant（类型安全 union）
using Shape = std::variant<Circle, Rectangle, Triangle>;
std::visit([](auto& s) { s.draw(); }, shape);

// Ranges (C++20)
auto evens = numbers | std::views::filter([](int n) { return n % 2 == 0; })
                     | std::views::transform([](int n) { return n * 2; });
```

## 模板

```cpp
// 函数模板
template<typename T>
T clamp(T value, T lo, T hi) {
    return std::max(lo, std::min(hi, value));
}

// Concept (C++20)
template<typename T>
concept Printable = requires(T t) { std::cout << t; };

template<Printable T>
void print(T value) { std::cout << value << '\n'; }

// SFINAE (C++17 前)
template<typename T, std::enable_if_t<std::is_integral_v<T>>* = nullptr>
void process(T value) { /* 只接受整数 */ }
```

## 并发

```cpp
#include <mutex>
#include <thread>
#include <atomic>

// lock_guard（RAII 互斥锁）
std::mutex mu;
void increment(int& counter) {
    std::lock_guard<std::mutex> lock(mu);
    ++counter;
}

// atomic（无锁计数）
std::atomic<int> counter{0};
counter.fetch_add(1, std::memory_order_relaxed);

// async 异步任务
auto future = std::async(std::launch::async, []{ return compute(); });
auto result = future.get();
```
```

- [ ] **Step 4: 运行测试**

```bash
node tests/run-all.js
```

- [ ] **Step 5: Commit**

```bash
git add agents/cpp-reviewer.md agents/cpp-build-resolver.md skills/cpp-patterns/SKILL.md
git commit -m "feat: 新增 C++ 三件套（reviewer + build-resolver + patterns）"
```

---

## Task 8: C# 三件套

**Files:**
- Create: `agents/csharp-reviewer.md`
- Create: `agents/csharp-build-resolver.md`
- Create: `skills/csharp-patterns/SKILL.md`

- [ ] **Step 1: 创建 csharp-reviewer.md**

创建 `agents/csharp-reviewer.md`，内容如下：

```markdown
---
name: csharp-reviewer
description: C# 专项代码审查。聚焦 async/await 死锁、IDisposable 泄漏、LINQ 延迟求值陷阱、nullable 注解完整性。
tools: Read, Grep, Glob, Bash
model: sonnet
---

# C# Reviewer - C# 专项审查

专注 C# 独有问题与 .NET 生态常见陷阱。

## 核心审查维度

### 1. Async/Await 死锁（CRITICAL）
- 禁止 `.Result`/`.Wait()` 在 async 上下文（会死锁）
- `async void` 只能用于事件处理器，否则异常无法捕获
- `ConfigureAwait(false)` 在库代码中使用（避免上下文切换）

```csharp
// ❌ 死锁风险
public string GetData() {
    return GetDataAsync().Result;  // 死锁！
}

// ✅ 正确
public async Task<string> GetData() {
    return await GetDataAsync().ConfigureAwait(false);
}
```

### 2. IDisposable 泄漏
- 实现 `IDisposable` 的对象必须用 `using` 语句
- `HttpClient` 不要在每次请求时 new（用 `IHttpClientFactory`）
- `DbContext` 不要单例注入（生命周期不匹配）

```csharp
// ❌ 泄漏
var conn = new SqlConnection(connStr);
conn.Open();
// 未 Dispose！

// ✅ using
await using var conn = new SqlConnection(connStr);
await conn.OpenAsync();
```

### 3. LINQ 延迟求值
- `IEnumerable<T>` 在每次枚举时重新执行查询
- 需要多次使用的结果用 `.ToList()`/`.ToArray()` 物化
- 避免 `Count()` 后再 `foreach`（两次枚举）

```csharp
// ❌ 重复查询数据库
var users = db.Users.Where(u => u.IsActive);
Console.WriteLine(users.Count());  // 查询1
foreach (var u in users) { ... }   // 查询2

// ✅ 物化一次
var users = db.Users.Where(u => u.IsActive).ToList();
```

### 4. Nullable 注解
- 项目应开启 `<Nullable>enable</Nullable>`
- 公开 API 的可空性必须正确标注
- 禁止 `null!`（强制非空断言）在生产代码中

### 5. Entity Framework
- 异步方法用 `async`/`await`（`ToListAsync`、`FirstOrDefaultAsync`）
- N+1 查询：用 `.Include()` 预加载导航属性
- 不要在循环中调用 `SaveChanges`（批量操作）

## 审查流程

```bash
# 构建
dotnet build --no-incremental

# 分析器
dotnet build /warnaserror

# 格式
dotnet format --verify-no-changes
```

## 输出格式

```markdown
## C# 审查报告

### 问题列表
| 严重度 | 文件:行号 | 类别 | 问题描述 |
|--------|---------|------|---------|
| CRITICAL | Service.cs:45 | async | .Result 死锁风险 |
| CRITICAL | Repo.cs:23 | 资源 | SqlConnection 未 Dispose |
| WARNING | Query.cs:67 | LINQ | IEnumerable 多次枚举 |

### 总结
- async 死锁风险: X 处
- IDisposable 泄漏: X 处
- LINQ 延迟求值问题: X 处
```
```

- [ ] **Step 2: 创建 csharp-build-resolver.md**

创建 `agents/csharp-build-resolver.md`，内容如下：

```markdown
---
name: csharp-build-resolver
description: C#/.NET 构建错误修复专家 — NuGet 依赖冲突、目标框架不兼容、EF migrations 不同步、缺少 using 快速定位和修复
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# C# Build Resolver - C#/.NET 构建错误修复专家

快速定位并以最小改动修复 .NET 项目的构建错误。

## 核心能力

### 错误模式识别
- **编译错误**: `CS0246 type not found`、`CS1061 member not found`、缺少 `using`
- **NuGet 冲突**: 包版本不兼容、`NU1107` 依赖冲突
- **框架问题**: `net6.0` vs `net8.0` 不兼容 API
- **EF Migrations**: migration 与 model 不同步、`PendingModelChangesWarning`
- **生成代码**: Roslyn source generator 失败

### 最小修复策略
- 先 `dotnet restore` 确认包已下载
- 类型找不到先加 `using`，再考虑安装包
- 版本冲突先在 `.csproj` 中锁定版本
- EF 报 migration 问题时先 `dotnet ef migrations add`

## 工作流程

### 1. 诊断

```bash
# 还原并构建
dotnet restore
dotnet build 2>&1

# NuGet 依赖树
dotnet list package --include-transitive

# EF 状态
dotnet ef migrations list
dotnet ef database update --dry-run
```

### 2. 常见错误速查

| 错误 | 原因 | 修复 |
|------|------|------|
| `CS0246: type 'X' not found` | 缺少 using 或包未引用 | 添加 `using X.Y;` 或安装 NuGet 包 |
| `CS1061: 'X' does not contain definition for 'Y'` | API 在该 .NET 版本不存在 | 检查 TFM，改用兼容 API |
| `NU1107: Version conflict` | 两个包依赖不兼容版本 | 在 `.csproj` 中显式锁定版本 |
| `Your startup project doesn't reference Microsoft.EntityFrameworkCore.Design` | EF tools 缺包 | `dotnet add package Microsoft.EntityFrameworkCore.Design` |
| `Unable to create an object of type 'DbContext'` | EF 找不到 DbContext 工厂 | 实现 `IDesignTimeDbContextFactory<T>` |

### 3. 版本锁定

```xml
<!-- .csproj 中锁定传递依赖版本 -->
<ItemGroup>
  <PackageReference Include="System.Text.Json" Version="8.0.0" />
</ItemGroup>
```

### 4. EF Migration 修复

```bash
# 查看 pending changes
dotnet ef migrations has-pending-model-changes

# 新增 migration
dotnet ef migrations add FixUserTable

# 更新数据库
dotnet ef database update
```

### 5. 验证

```bash
dotnet build --no-incremental && echo "BUILD SUCCESS"
```

## 输出格式

```markdown
## C# 构建修复报告

### 错误概况
- 修复前: X 个错误
- 修复后: 0 个错误

### 修复记录
| # | 错误 | 文件 | 修复方式 | 根因 |
|---|------|------|---------|------|
| 1 | CS0246: UserDto not found | Service.cs:12 | 添加 using DTOs | 缺少命名空间 |
```
```

- [ ] **Step 3: 创建 skills/csharp-patterns/SKILL.md**

创建目录并写文件 `skills/csharp-patterns/SKILL.md`：

```markdown
---
name: csharp-patterns
description: C# 开发模式参考 — async/await、LINQ、依赖注入、Entity Framework、nullable 类型。
---

# C# 开发模式参考

## Async/Await

```csharp
// 正确的 async 链
public async Task<User> GetUserAsync(int id, CancellationToken ct = default) {
    var user = await _db.Users
        .AsNoTracking()
        .FirstOrDefaultAsync(u => u.Id == id, ct)
        .ConfigureAwait(false);
    return user ?? throw new NotFoundException($"User {id} not found");
}

// 并发执行
var (users, orders) = await (
    _db.Users.ToListAsync(ct),
    _db.Orders.ToListAsync(ct)
).WhenAll();

// 安全的 Task.WhenAll
var results = await Task.WhenAll(tasks);
```

规则: 全链路 async | 不用 .Result/.Wait() | 库代码加 ConfigureAwait(false) | 传递 CancellationToken

## LINQ

```csharp
// 物化避免多次查询
var activeUsers = await _db.Users
    .Where(u => u.IsActive && u.CreatedAt > cutoff)
    .OrderBy(u => u.Name)
    .Select(u => new UserDto(u.Id, u.Name, u.Email))
    .ToListAsync(ct);

// 分组
var byDept = employees
    .GroupBy(e => e.Department)
    .ToDictionary(g => g.Key, g => g.ToList());

// 展平
var allTags = posts.SelectMany(p => p.Tags).Distinct().ToList();
```

## 依赖注入

```csharp
// 注册服务
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddSingleton<IEmailService, SendGridEmailService>();
builder.Services.AddHttpClient<IGithubClient, GithubClient>(client => {
    client.BaseAddress = new Uri("https://api.github.com");
});

// 构造函数注入
public class UserService(IUserRepository repo, ILogger<UserService> logger) {
    public async Task<User> CreateAsync(CreateUserDto dto) {
        logger.LogInformation("Creating user {Email}", dto.Email);
        return await repo.AddAsync(new User(dto));
    }
}
```

## Nullable 参考类型

```csharp
// 开启 nullable（.csproj）
// <Nullable>enable</Nullable>

string name = GetName();       // 非空
string? optName = TryGetName(); // 可空

// 空值合并
var display = optName ?? "Anonymous";
var length = optName?.Length ?? 0;

// 模式匹配
if (optName is { Length: > 0 } nonEmpty) {
    Process(nonEmpty); // 编译器知道非空
}
```

## Entity Framework 模式

```csharp
// 预加载避免 N+1
var orders = await _db.Orders
    .Include(o => o.Items)
        .ThenInclude(i => i.Product)
    .Where(o => o.UserId == userId)
    .AsNoTracking()  // 只读查询加此行，性能更好
    .ToListAsync(ct);

// 批量操作
await _db.Users
    .Where(u => u.LastLogin < cutoff)
    .ExecuteUpdateAsync(s => s.SetProperty(u => u.IsActive, false));

// 事务
await using var tx = await _db.Database.BeginTransactionAsync(ct);
try {
    // ... 操作
    await _db.SaveChangesAsync(ct);
    await tx.CommitAsync(ct);
} catch {
    await tx.RollbackAsync(ct);
    throw;
}
```
```

- [ ] **Step 4: 运行测试**

```bash
node tests/run-all.js
```

- [ ] **Step 5: Commit**

```bash
git add agents/csharp-reviewer.md agents/csharp-build-resolver.md skills/csharp-patterns/SKILL.md
git commit -m "feat: 新增 C# 三件套（reviewer + build-resolver + patterns）"
```

---

## Task 9: Flutter/Dart 三件套

**Files:**
- Create: `agents/flutter-reviewer.md`
- Create: `agents/flutter-build-resolver.md`
- Create: `skills/flutter-patterns/SKILL.md`

- [ ] **Step 1: 创建 flutter-reviewer.md**

创建 `agents/flutter-reviewer.md`，内容如下：

```markdown
---
name: flutter-reviewer
description: Flutter/Dart 专项代码审查。聚焦 Widget 重建性能、BuildContext 跨 async 使用、null safety 绕过、状态管理反模式。
tools: Read, Grep, Glob, Bash
model: sonnet
---

# Flutter Reviewer - Flutter/Dart 专项审查

专注 Flutter 性能问题和 Dart 独有陷阱。

## 核心审查维度

### 1. BuildContext 跨 Async 使用（CRITICAL）
- 禁止在 `await` 后使用 `BuildContext`（Widget 可能已 unmounted）
- 检查 `mounted` 状态后再使用 context

```dart
// ❌ await 后使用 context（Widget 可能已销毁）
Future<void> _submit() async {
    await api.submit(data);
    Navigator.pop(context); // context 可能无效！
}

// ✅ 检查 mounted
Future<void> _submit() async {
    await api.submit(data);
    if (!mounted) return;
    Navigator.pop(context);
}
```

### 2. setState 生命周期
- `setState` 禁止在 `dispose()` 后调用
- 异步操作完成后调用 `setState` 前检查 `mounted`
- `initState` 中不能调用 `context`（用 `WidgetsBinding.addPostFrameCallback`）

### 3. Widget 重建性能
- 静态 Widget 加 `const` 构造函数（避免不必要重建）
- 将大 Widget 树中稳定部分提取为独立 Widget
- ListView 用 `ListView.builder`（懒加载）而非 `ListView(children: [...])`

```dart
// ❌ 每次重建都创建新对象
Widget build(BuildContext context) {
    return Container(
        child: Text("Hello"),  // 每次都新建
    );
}

// ✅ const 避免重建
Widget build(BuildContext context) {
    return const Text("Hello");
}
```

### 4. Null Safety
- 禁止 `!`（强制非空）在生产逻辑中
- 使用 `??`、`?.`、`if (x != null)` 安全处理可空值

### 5. 状态管理
- `setState` 只用于 Widget 局部状态，跨 Widget 用状态管理库
- Provider/Riverpod：避免 `context.read` 在 `build` 方法中（用 `context.watch`）
- BLoC：`close()` Stream 在 `dispose` 中

## 审查流程

```bash
# 静态分析
flutter analyze

# 格式
dart format --set-exit-if-changed .

# 测试
flutter test
```

## 输出格式

```markdown
## Flutter 审查报告

### 问题列表
| 严重度 | 文件:行号 | 类别 | 问题描述 |
|--------|---------|------|---------|
| CRITICAL | screen.dart:45 | context | await 后使用 BuildContext，未检查 mounted |
| HIGH | list.dart:23 | 性能 | ListView 未用 builder，全量渲染 |
| WARNING | widget.dart:67 | 性能 | const Widget 缺少 const 关键字 |

### 总结
- BuildContext 危险使用: X 处
- 性能问题: X 处
- Null Safety 绕过: X 处
```
```

- [ ] **Step 2: 创建 flutter-build-resolver.md**

创建 `agents/flutter-build-resolver.md`，内容如下：

```markdown
---
name: flutter-build-resolver
description: Flutter/Dart 构建错误修复专家 — pubspec 版本冲突、native plugin 编译失败、Dart SDK 版本不兼容、flutter pub 问题快速定位和修复
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# Flutter Build Resolver - Flutter/Dart 构建错误修复专家

快速定位并以最小改动修复 Flutter/Dart 项目的构建错误。

## 核心能力

### 错误模式识别
- **pubspec 冲突**: `version solving failed`、依赖版本不兼容
- **Dart 错误**: 类型错误、null safety 迁移问题、语法错误
- **Native 编译**: Android Gradle 失败、iOS Pod 失败、plugin ABI 问题
- **SDK 版本**: Dart SDK constraint 不满足、Flutter channel 不兼容
- **代码生成**: `build_runner` 生成文件过期

### 最小修复策略
- pubspec 冲突先 `flutter pub upgrade --major-versions`
- 类型错误优先添加显式类型，而非修改逻辑
- Native 问题先 clean 再 rebuild
- 代码生成问题先重新运行 `build_runner`

## 工作流程

### 1. 诊断

```bash
# 基本诊断
flutter doctor -v
flutter pub get
flutter analyze

# 详细构建日志
flutter build apk --debug -v 2>&1 | head -100
flutter build ios --debug --no-codesign -v 2>&1 | head -100

# 代码生成状态
dart run build_runner build --delete-conflicting-outputs
```

### 2. 常见错误速查

| 错误 | 原因 | 修复 |
|------|------|------|
| `Because X depends on Y ^1.0.0 which doesn't match Z` | pubspec 版本冲突 | `flutter pub upgrade` 或手动对齐版本 |
| `The current Dart SDK version is X. But package Y requires >=Z` | Dart SDK 版本太低 | 升级 Flutter channel 或放宽约束 |
| `Expected a value of type 'X' but got one of type 'Y'` | null safety 类型不匹配 | 添加类型转换或 null check |
| `Undefined name 'X'` | 缺少 import 或 part 声明 | 添加 `import 'package:X/X.dart'` |
| `Could not resolve com.android.tools.build:gradle` | Android Gradle 找不到 | 修改 `android/build.gradle` repository 配置 |
| `CocoaPods could not find compatible versions for pod "X"` | iOS Pod 版本冲突 | `cd ios && pod update X` |

### 3. 清理命令

```bash
# Flutter 完整清理
flutter clean
flutter pub get

# iOS Pod 清理
cd ios && pod deintegrate && pod install && cd ..

# Android 清理
cd android && ./gradlew clean && cd ..

# 代码生成清理
dart run build_runner clean
dart run build_runner build --delete-conflicting-outputs
```

### 4. 验证

```bash
flutter build apk --debug && echo "BUILD SUCCESS"
```

## 输出格式

```markdown
## Flutter 构建修复报告

### 错误概况
- 修复前: X 个错误
- 修复后: 0 个错误

### 修复记录
| # | 错误 | 文件 | 修复方式 | 根因 |
|---|------|------|---------|------|
| 1 | version solving failed | pubspec.yaml | 放宽 http 版本约束 | 版本冲突 |
```
```

- [ ] **Step 3: 创建 skills/flutter-patterns/SKILL.md**

创建目录并写文件 `skills/flutter-patterns/SKILL.md`：

```markdown
---
name: flutter-patterns
description: Flutter/Dart 开发模式参考 — Widget 组合、状态管理（Riverpod/BLoC）、async/Future、null safety、测试。
---

# Flutter/Dart 开发模式参考

## Widget 组合

```dart
// 优先组合，不继承
class UserCard extends StatelessWidget {
  const UserCard({super.key, required this.user});
  final User user;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: CircleAvatar(backgroundImage: NetworkImage(user.avatarUrl)),
        title: Text(user.name),
        subtitle: Text(user.email),
        trailing: const Icon(Icons.arrow_forward_ios),
      ),
    );
  }
}

// const 构造函数性能优化
class AppHeader extends StatelessWidget {
  const AppHeader({super.key, required this.title});
  final String title;
  @override
  Widget build(BuildContext context) => Text(title, style: Theme.of(context).textTheme.headlineMedium);
}
```

原则: 尽可能用 `const` | 拆小 Widget | StatelessWidget 优先

## Riverpod 状态管理

```dart
// Provider 定义
@riverpod
Future<List<User>> users(UsersRef ref) async {
  return ref.watch(userRepositoryProvider).getAll();
}

@riverpod
class UserNotifier extends _$UserNotifier {
  @override
  Future<User?> build(String userId) async {
    return ref.watch(userRepositoryProvider).findById(userId);
  }

  Future<void> update(UserUpdate data) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() =>
        ref.read(userRepositoryProvider).update(userId, data));
  }
}

// 在 Widget 中使用
class UserScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final users = ref.watch(usersProvider);
    return users.when(
      loading: () => const CircularProgressIndicator(),
      error: (e, _) => Text('Error: $e'),
      data: (list) => UserList(users: list),
    );
  }
}
```

## Async / Future

```dart
// FutureBuilder
FutureBuilder<User>(
  future: fetchUser(id),
  builder: (context, snapshot) {
    if (snapshot.connectionState == ConnectionState.waiting)
      return const CircularProgressIndicator();
    if (snapshot.hasError) return Text('Error: ${snapshot.error}');
    return UserCard(user: snapshot.requireData);
  },
)

// async/await 安全模式
Future<void> submit() async {
    try {
        await api.post(data);
        if (!mounted) return;  // 必须检查！
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Done')));
    } catch (e) {
        if (!mounted) return;
        showDialog(context: context, builder: (_) => ErrorDialog(error: e));
    }
}
```

## Null Safety

```dart
// 可空处理模式
String? name = getName();
final display = name ?? 'Anonymous';
final length = name?.length ?? 0;
name?.let((n) => process(n));  // 扩展函数

// 断言只在确定非空时用（测试中）
final user = cache['admin']!; // 仅测试/确定有值时用

// 晚初始化（一定会在使用前赋值）
late final Database _db;
@override
void initState() {
    super.initState();
    _db = Database.open();
}
```

## 测试

```dart
// Widget 测试
testWidgets('UserCard shows name', (tester) async {
  await tester.pumpWidget(MaterialApp(
    home: UserCard(user: User(id: '1', name: 'Alice', email: 'a@a.com')),
  ));
  expect(find.text('Alice'), findsOneWidget);
});

// Unit 测试（Riverpod）
test('users provider returns list', () async {
  final container = ProviderContainer(overrides: [
    userRepositoryProvider.overrideWithValue(FakeUserRepository()),
  ]);
  addTearDown(container.dispose);
  final users = await container.read(usersProvider.future);
  expect(users, isNotEmpty);
});
```
```

- [ ] **Step 4: 运行测试**

```bash
node tests/run-all.js
```

- [ ] **Step 5: Commit**

```bash
git add agents/flutter-reviewer.md agents/flutter-build-resolver.md skills/flutter-patterns/SKILL.md
git commit -m "feat: 新增 Flutter/Dart 三件套（reviewer + build-resolver + patterns）"
```

---

## Task 10: Sync-Codex + 最终验证

**Files:** 无新增，仅运行同步和验证

- [ ] **Step 1: 运行 sync-codex**

```bash
node scripts/sync-codex.js
```
预期输出：同步成功，无错误。检查 `.codex/agents/` 和 `.agents/skills/` 是否包含新增文件。

- [ ] **Step 2: 完整测试套件**

```bash
node tests/run-all.js
```
预期：所有测试通过，0 failures。

- [ ] **Step 3: Lint 检查**

```bash
npm run lint
```
预期：hooks.json 格式合法，0 错误。

- [ ] **Step 4: 验证新文件都存在**

```bash
ls agents/ | grep -E "build-resolver|rust|kotlin|cpp|csharp|flutter"
ls skills/ | grep -E "rust|kotlin|cpp|csharp|flutter"
```
预期输出：
```
cpp-build-resolver.md
csharp-build-resolver.md
flutter-build-resolver.md
go-build-resolver.md
java-build-resolver.md
kotlin-build-resolver.md
python-build-resolver.md
rust-build-resolver.md
rust-reviewer.md
kotlin-reviewer.md
cpp-reviewer.md
csharp-reviewer.md
flutter-reviewer.md
---
cpp-patterns
csharp-patterns
flutter-patterns
kotlin-patterns
rust-patterns
```

- [ ] **Step 5: Commit sync 结果**

```bash
git add .codex/ .agents/
git commit -m "chore: sync-codex — 同步全栈语言覆盖扩展到 Codex 适配层"
```
