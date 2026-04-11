---
name: swift-patterns
description: Swift 开发模式参考 — SwiftUI、@Observable、actor 并发、SwiftData、Sendable。
---

# Swift 开发模式参考

Swift 6 + SwiftUI + SwiftData 现代开发模式。

## SwiftUI + @Observable

```swift
@Observable
final class ViewModel {
    var items: [Item] = []
    var isLoading = false
    private(set) var errorMessage: String?

    @ObservationIgnored
    private var cache: [String: Data] = [:]
}

struct ContentView: View {
    @State private var viewModel = ViewModel()
    var body: some View {
        List(viewModel.items) { item in ItemRow(item: item) }
    }
}
```

- `@Observable` 是类，`@State` 管理生命周期
- `@ObservationIgnored` 排除不触发更新的属性
- `@Environment` 用于跨视图层级共享

## Actor 并发模型

```swift
actor DataStore {
    private var cache: [String: Data] = [:]
    func get(_ key: String) -> Data? { cache[key] }
    func set(_ key: String, data: Data) { cache[key] = data }
}

// 使用
let store = DataStore()
Task {
    await store.set("key", data: data)
    let value = await store.get("key")
}
```

规则: 共享可变状态必须用 `actor` | `@MainActor` 标记 UI | 网络/数据层独立 actor

## SwiftData @Model

```swift
@Model
final class Item {
    var title: String
    var createdAt: Date
    @Relationship(deleteRule: .cascade) var subItems: [SubItem] = []
}

// 注意: @Model 不是 Sendable，跨 actor 用 snapshot
struct ItemSnapshot: Sendable {
    let id: UUID; let title: String; let isCompleted: Bool
}
```

## Sendable 跨 actor

```swift
struct Config: Sendable {
    let apiKey: String; let timeout: TimeInterval
}

actor NetworkClient {
    func fetchConfig() async throws -> Config { Config(apiKey: "...", timeout: 30) }
}
```

## async/await 模式

```swift
// 并行执行
func loadAll() async throws -> [Item] {
    async let items = fetchItems()
    async let config = fetchConfig()
    let (result, _) = try await (items, config)
    return result
}

// Task Group
func loadAll(ids: [UUID]) async -> [Item] {
    await withTaskGroup(of: Item?.self) { group in
        for id in ids { group.addTask { try? await self.fetchItem(id: id) } }
        var results: [Item] = []
        for await item in group { if let item { results.append(item) } }
        return results
    }
}
```

## 错误处理

```swift
enum NetworkError: LocalizedError {
    case invalidURL(String); case httpError(Int); case decodingFailed(Error)
    var errorDescription: String? { switch self {
        case .invalidURL(let url): "Invalid URL: \(url)"
        case .httpError(let code): "HTTP Error: \(code)"
        case .decodingFailed(let e): "Decoding failed: \(e)"
    }}
}

// Swift 6 typed throws
func fetch(id: UUID) throws(NetworkError) -> Item { ... }
```

## 属性包装器

```swift
@propertyWrapper
struct Clamped<T: Comparable> {
    var value: T; let range: ClosedRange<T>
    var wrappedValue: T {
        get { value }
        set { value = min(max(newValue, range.lowerBound), range.upperBound) }
    }
}

struct Config { @Clamped(0...100) var timeout: Int = 30 }
```
