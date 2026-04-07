# Swift 设计模式

> 本文件扩展 [common/coding-style.md](../coding-style.md)

## 结构化并发

```swift
// ✅ TaskGroup 并行处理，自动取消管理
func fetchDashboard() async throws -> Dashboard {
    try await withThrowingTaskGroup(of: DashboardSection.self) { group in
        group.addTask { try await fetchStats() }
        group.addTask { try await fetchRecentActivity() }
        group.addTask { try await fetchNotifications() }
        var sections: [DashboardSection] = []
        for try await section in group { sections.append(section) }
        return Dashboard(sections: sections)
    }
}
```

## @Bindable 与 NavigationStack

```swift
// ✅ @Bindable 用于 @Observable 的双向绑定
struct EditProfileView: View {
    @Bindable var user: User
    var body: some View {
        Form {
            TextField("名称", text: $user.name)
            TextField("邮箱", text: $user.email)
        }
    }
}

// ✅ 类型安全的导航路径
enum Route: Hashable {
    case userProfile(id: String)
    case settings
}
struct AppView: View {
    @State private var path = NavigationPath()
    var body: some View {
        NavigationStack(path: $path) {
            HomeView()
                .navigationDestination(for: Route.self) { route in
                    switch route {
                    case .userProfile(let id): UserProfileView(userId: id)
                    case .settings: SettingsView()
                    }
                }
        }
    }
}
```

## SwiftData 快照模式

```swift
// ✅ @Model 不是 Sendable，跨 actor 用快照
@Model final class User {
    @Attribute(.unique) var id: String
    var name: String
}

struct UserSnapshot: Sendable {
    let id: String
    let name: String
    init(from user: User) { id = user.id; name = user.name }
}

@MainActor
final class UserListViewModel: Observable {
    func loadUsers() throws -> [UserSnapshot] {
        let users = try modelContext.fetch(FetchDescriptor<User>(sortBy: [SortDescriptor(\.name)]))
        return users.map(UserSnapshot.init)
    }
}
```

## 依赖注入

```swift
// ✅ 协议 + Environment 注入
protocol AuthenticationService: Sendable {
    func login(email: String, password: String) async throws -> User
}
extension EnvironmentValues {
    var authService: any AuthenticationService {
        get { self[AuthServiceKey.self] }
        set { self[AuthServiceKey.self] = newValue }
    }
}
```
