# Swift 编码风格

> 本文件扩展 [common/coding-style.md](../coding-style.md)

## Swift 6 严格并发

```swift
// SWIFT_STRICT_CONCURRENCY: complete
// 跨 actor 传值必须是 Sendable

actor DataStore {
    private var cache: [String: Data] = [:]
    func get(_ key: String) -> Data? { cache[key] }
    func set(_ key: String, data: Data) { cache[key] = data }
}

// ✅ 网络层用 actor 隔离
actor NetworkClient: Sendable {
    func fetch<T: Decodable & Sendable>(url: URL) async throws -> T {
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(T.self, from: data)
    }
}
```

## @Observable + SwiftUI

```swift
@Observable
final class ViewModel {
    var items: [Item] = []
    var isLoading = false
    @ObservationIgnored private let service: ItemService

    func loadItems() async {
        isLoading = true
        defer { isLoading = false }
        items = (try? await service.fetchAll()) ?? []
    }
}

// ✅ @Environment 注入
struct ItemListView: View {
    @Environment(ViewModel.self) private var viewModel
    var body: some View {
        List(viewModel.items) { ItemRow(item: $0) }
            .task { await viewModel.loadItems() }
    }
}
```

## @MainActor 与 Sendable

```swift
// ✅ UI/ViewModel 用 @MainActor
@MainActor final class ContentViewModel: Observable {
    var text = ""
    func updateFromNetwork() async { text = await fetchText() }
}

// ✅ 跨 actor 传值用快照（值类型）
struct UserSnapshot: Sendable {
    let id: String
    let name: String
}
```

## 命名规范

| 类型 | 风格 | 示例 |
|------|------|------|
| 类型/协议 | PascalCase | `UserService`, `Repository` |
| 函数/方法 | camelCase | `fetchUser()`, `calculateTotal()` |
| 常量 | PascalCase | `maxRetryCount`, `DefaultTimeout` |
| 枚举 case | camelCase | `.success`, `.notFound` |
| 协议（能力） | -able | `Codable`, `Sendable` |

## 访问控制与错误处理

```swift
// ✅ public enum 静态命名空间
public enum NetworkError: Sendable {
    case networkUnavailable
    case invalidResponse(statusCode: Int)
}

// ✅ typed throws (Swift 6.1+)
func fetchUser(id: String) async throws(UserError) -> User {
    guard !id.isEmpty else { throw .invalidInput("ID 不能为空") }
    // ...
}
```
