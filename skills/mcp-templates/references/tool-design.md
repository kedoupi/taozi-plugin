# MCP 工具设计详解

## 命名规范

```typescript
// ✅ 好的命名
"search_files"      // 动词_名词
"get_user_info"     // 清晰的意图
"create_document"   // 明确的操作

// ❌ 避免的命名
"doStuff"           // 模糊
"handler"           // 无意义
"process"           // 过于通用
```

## 输入 Schema 设计

```typescript
{
  inputSchema: {
    type: "object",
    properties: {
      // 必填参数放前面
      query: {
        type: "string",
        description: "搜索查询词，支持通配符 *",
      },
      // 可选参数提供默认值说明
      limit: {
        type: "number",
        description: "返回结果数量限制，默认 10",
      },
      // 枚举值明确列出
      format: {
        type: "string",
        enum: ["json", "text", "markdown"],
        description: "输出格式",
      },
    },
    required: ["query"],
  },
}
```

## 错误处理

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const result = await processRequest(request);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  } catch (error) {
    // 返回有意义的错误信息
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}\n\nPlease check: ...`,
        },
      ],
      isError: true,
    };
  }
});
```

## 常见工具模式

### 数据库查询工具
```typescript
{
  name: "query_database",
  description: "执行 SQL 查询（只读）",
  inputSchema: {
    type: "object",
    properties: {
      sql: { type: "string", description: "SELECT 查询语句" },
      params: { type: "array", description: "查询参数" },
    },
    required: ["sql"],
  },
}
```

### 文件操作工具
```typescript
{
  name: "read_file",
  description: "读取文件内容",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "文件路径" },
      encoding: { type: "string", default: "utf-8" },
    },
    required: ["path"],
  },
}
```

### API 调用工具
```typescript
{
  name: "call_api",
  description: "调用外部 API",
  inputSchema: {
    type: "object",
    properties: {
      endpoint: { type: "string" },
      method: { type: "string", enum: ["GET", "POST"] },
      body: { type: "object" },
    },
    required: ["endpoint"],
  },
}
```

## 调试技巧

### 日志输出
```typescript
// 输出到 stderr（不影响 stdio 通信）
console.error("[DEBUG]", "Processing request:", request);
```

### 测试工具
```bash
# 使用 MCP Inspector
npx @modelcontextprotocol/inspector node ./server.js

# 手动测试 stdio
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node server.js
```

## 最佳实践

### DO
- 提供清晰的工具描述
- 验证所有输入参数
- 返回结构化的结果
- 处理所有错误情况
- 添加调试日志

### DON'T
- 暴露敏感凭据
- 允许任意代码执行
- 忽略输入验证
- 返回过大的响应
- 阻塞主事件循环
