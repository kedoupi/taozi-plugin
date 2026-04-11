---
name: swift-concurrency
description: Swift 6.2 严格并发模式 — actor isolation、Sendable 协议、结构化并发、MainActor 边界、typed throws。
---

# Swift 6.2 严格并发

Swift 6 + `SWIFT_STRICT_CONCURRENCY: complete` 下的并发编程完整指南。

## Actor Isolation 基础

```swift
// ✅ actor 保护可变状态
actor ImageCache {
    private var storage: [URL: UIImage] = [:]

    func image(for url: URL) -> UIImage? { storage[url] }
    func store(_ image: UIImage, for url: URL) { storage[url] = image }
}

// ✅ @MainActor 绑定 UI 更新
@MainActor
@Observable
final class FeedViewModel {
    var posts: [Post] = []
    var isLoading = false

    func loadPosts() async {
        isLoading = true
        defer { isLoading = false }
        posts = try? await PostService.shared.fetchAll() ?? []
    }
}
```

## Sendable 跨 Actor 传值

```swift
// @Model 不是 Sendable，必须用 snapshot 跨 actor 传递
@Model final class Post {
    var id: UUID
    var title: String
}

// ✅ 定义 Sendable snapshot
struct PostSnapshot: Sendable {
    let id: UUID
    let title: String

    init(_ post: Post) {
        self.id = post.id
        self.title = post.title
    }
}

// ✅ 在 actor 边界传 snapshot
actor SyncEngine {
    func process(_ snapshot: PostSnapshot) async { ... }
}
```

## 结构化并发

```swift
// ✅ async let 并行启动，await 处汇合
func loadDashboard() async throws -> Dashboard {
    async let user = UserService.fetchCurrent()
    async let stats = StatsService.fetchToday()
    async let feed = FeedService.fetchLatest(limit: 20)
    return try await Dashboard(user: user, stats: stats, feed: feed)
}

// ✅ TaskGroup 动态并行
func prefetchImages(urls: [URL]) async -> [URL: UIImage] {
    await withTaskGroup(of: (URL, UIImage)?.self) { group in
        for url in urls {
            group.addTask { try? await (url, ImageLoader.load(url)) }
        }
        var result: [URL: UIImage] = [:]
        for await pair in group {
            if let (url, image) = pair { result[url] = image }
        }
        return result
    }
}
```

## Typed Throws（Swift 6+）

```swift
enum NetworkError: Error {
    case unauthorized
    case notFound(String)
    case serverError(Int)
}

// ✅ typed throws — 调用方精确知道可能的错误类型
func fetchUser(id: UUID) async throws(NetworkError) -> User {
    let response = try await session.data(from: userURL(id))
    guard response.statusCode != 401 else { throw .unauthorized }
    guard response.statusCode != 404 else { throw .notFound(id.uuidString) }
    return try JSONDecoder().decode(User.self, from: response.data)
}

// 调用方无需捕获 Error，只处理 NetworkError
do {
    let user = try await fetchUser(id: id)
} catch .unauthorized {
    showLoginScreen()
} catch .notFound(let id) {
    showError("User \(id) not found")
}
```

## Task 生命周期管理

```swift
// ✅ 在 View 中管理 Task，避免泄漏
struct PostListView: View {
    @State private var viewModel = PostListViewModel()

    var body: some View {
        List(viewModel.posts) { PostRow(post: $0) }
            .task { await viewModel.loadPosts() }  // 视图消失时自动取消
    }
}

// ✅ 手动取消
@Observable
final class SearchViewModel {
    private var searchTask: Task<Void, Never>?

    func search(query: String) {
        searchTask?.cancel()
        searchTask = Task {
            try? await Task.sleep(for: .milliseconds(300)) // debounce
            guard !Task.isCancelled else { return }
            await performSearch(query)
        }
    }
}
```

## 常见 Swift 6 编译错误

```swift
// ❌ 错误：从非隔离上下文访问 @MainActor 属性
class OldDelegate: NSObject {
    func didFinish() {
        viewModel.isLoading = false  // 编译错误！
    }
}

// ✅ 修复：显式切换到 MainActor
class OldDelegate: NSObject {
    func didFinish() {
        Task { @MainActor in
            viewModel.isLoading = false
        }
    }
}
```

## 检查清单

- [ ] 共享可变状态用 `actor` 保护
- [ ] UI 更新在 `@MainActor` 上下文
- [ ] 跨 actor 传值用 `Sendable` 类型
- [ ] `@Model` 类型不直接跨 actor 传递
- [ ] 长运行 Task 有取消路径
- [ ] 使用 `async let` / TaskGroup 而非嵌套 await
