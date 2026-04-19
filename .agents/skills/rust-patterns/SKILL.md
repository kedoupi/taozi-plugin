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
