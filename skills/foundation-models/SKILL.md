---
name: foundation-models
description: Apple Foundation Models on-device — FoundationModels 框架、设备端推理、隐私优先 AI、iOS 18+ 特性。
---

# Apple Foundation Models — 设备端 AI

iOS 18.1+ / macOS 15.1+ 的设备端 LLM 框架，完全离线，数据不离设备。

## 基础用法

```swift
import FoundationModels

// ✅ 简单文本生成
let session = LanguageModelSession()
let response = try await session.respond(to: "用三句话总结这段内容：\(text)")
print(response.content)
```

## 结构化输出（Generable）

```swift
// ✅ 定义输出结构
@Generable
struct TaskSummary {
    @Guide("任务的简短标题，不超过10个字")
    var title: String

    @Guide("优先级：high / medium / low")
    var priority: String

    @Guide("预计完成时间（分钟）")
    var estimatedMinutes: Int
}

// ✅ 生成结构化结果
let session = LanguageModelSession()
let summary: TaskSummary = try await session.respond(
    to: "分析这个任务：\(taskDescription)",
    generating: TaskSummary.self
)
print(summary.title, summary.priority)
```

## Streaming 响应

```swift
// ✅ 流式输出，适合长文本生成
struct ContentGeneratorView: View {
    @State private var output = ""
    @State private var session = LanguageModelSession()

    var body: some View {
        ScrollView { Text(output) }
            .task {
                let stream = session.streamResponse(to: prompt)
                for try await partial in stream {
                    output = partial.content
                }
            }
    }
}
```

## 可用性检查

```swift
// ✅ 始终检查可用性（模型可能未下载）
func generateSummary(for text: String) async -> String? {
    guard LanguageModelSession.isAvailable else {
        // 降级：使用服务端 API 或提示用户
        return nil
    }
    let session = LanguageModelSession()
    let response = try? await session.respond(to: "总结：\(text)")
    return response?.content
}
```

## System Prompt 设置

```swift
// ✅ 自定义 system prompt 限定模型行为
let session = LanguageModelSession(
    instructions: "你是一个专注于 Swift 代码的助手。只回答 Swift 相关问题，拒绝其他话题。"
)
```

## 隐私优先架构

```swift
// ✅ 敏感数据用设备端模型，普通数据可选云端
enum AIRoute {
    case onDevice   // 含 PII、健康、财务数据
    case cloud      // 公开内容、非敏感摘要

    static func route(for content: Content) -> AIRoute {
        content.containsSensitiveData ? .onDevice : .cloud
    }
}

func processContent(_ content: Content) async throws -> String {
    switch AIRoute.route(for: content) {
    case .onDevice:
        let session = LanguageModelSession()
        return try await session.respond(to: content.prompt).content
    case .cloud:
        return try await CloudAIService.process(content)
    }
}
```

## 常见限制与注意事项

| 限制 | 说明 |
|------|------|
| 模型大小 | ~3B 参数，能力有限，不适合复杂推理 |
| 首次使用 | 需要下载模型（~1GB），需检查可用性 |
| 上下文长度 | 有限，不适合超长文档 |
| 语言 | 英文效果最佳，中文支持一般 |
| 系统要求 | iOS 18.1+ / macOS 15.1+，Apple Silicon |

## 检查清单

- [ ] 调用前检查 `LanguageModelSession.isAvailable`
- [ ] 敏感数据（PII/健康/财务）优先用设备端
- [ ] 复杂推理任务考虑降级到云端 API
- [ ] 结构化输出使用 `@Generable` 而非字符串解析
- [ ] Streaming 用于长文本以提升体验
