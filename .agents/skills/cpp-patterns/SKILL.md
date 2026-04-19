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
