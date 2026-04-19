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
