# Swift 测试规范

> 本文件扩展 [common/testing.md](../testing.md)

## XCTest 框架

```swift
final class UserServiceTests: XCTestCase {
    var sut: UserService!
    var mockRepo: MockUserRepository!

    override func setUp() {
        mockRepo = MockUserRepository()
        sut = UserService(repository: mockRepo)
    }

    func testFetchUser_存在时返回用户() async throws {
        mockRepo.stubbedGetResult = User(id: "1", name: "测试")
        let result = try await sut.fetchUser(id: "1")
        XCTAssertEqual(result.id, "1")
    }
}
```

## Swift Testing（@Test 宏）

```swift
@Suite("用户服务测试")
struct UserServiceTests {
    let mockRepo = MockUserRepository()
    let sut: UserService

    init() { sut = UserService(repository: mockRepo) }

    @Test("获取存在的用户")
    func fetchExistingUser() async throws {
        mockRepo.stubbedGetResult = User(id: "1", name: "测试")
        let result = try await sut.fetchUser(id: "1")
        #expect(result.id == "1")
    }

    @Test("参数化测试", arguments: ["", "999", "invalid"])
    func fetchUserThrows(id: String) async {
        mockRepo.stubbedGetError = UserError.notFound
        await #expect { try await sut.fetchUser(id: id) } throws: { _ in true }
    }
}
```

## 异步测试与 XCUITest

```swift
// ✅ 并发测试
func testConcurrentFetch() async throws {
    let results = try await withThrowingTaskGroup(of: User.self) { group in
        for id in ["1", "2", "3"] { group.addTask { try await sut.fetchUser(id: id) } }
        var users: [User] = []
        for try await user in group { users.append(user) }
        return users
    }
    XCTAssertEqual(results.count, 3)
}

// ✅ UI 测试
func testLoginFlow() {
    app.textFields["邮箱"].tap()
    app.textFields["邮箱"].typeText("test@example.com")
    app.buttons["登录"].tap()
    XCTAssertTrue(app.staticTexts["首页"].waitForExistence(timeout: 5))
}
```

## 测试文件组织

```
Tests/
  MyModuleTests/
    Services/
      UserServiceTests.swift
    Models/
      UserTests.swift
    Mocks/
      MockUserRepository.swift
```
