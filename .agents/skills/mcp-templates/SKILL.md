---
name: mcp-templates
description: MCP Server 开发模板和最佳实践。创建 MCP 工具、集成 Claude 时使用。
---

# MCP 开发模板

## 何时使用

- 开发新的 MCP Server
- 设计工具接口
- Claude 集成

## 快速开始

### TypeScript 最小模板

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "my-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// 定义工具
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "my_tool",
    description: "工具描述",
    inputSchema: { type: "object", properties: {}, required: [] }
  }]
}));

// 处理调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // 实现逻辑
});

new StdioServerTransport().then(t => server.connect(t));
```

## 工具命名规范

```
search_files      # 动词_名词
get_user_info     # 清晰的意图
create_document   # 明确的操作
```

## 输入 Schema 设计

```typescript
inputSchema: {
  type: "object",
  properties: {
    query: { type: "string", description: "搜索查询词" },
    limit: { type: "number", description: "结果数量，默认 10" },
    format: { type: "string", enum: ["json", "text"] }
  },
  required: ["query"]
}
```

## 配置示例

### Claude Desktop
```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/server.js"]
    }
  }
}
```

## 最佳实践

- 提供清晰的工具描述
- 验证所有输入参数
- 返回结构化结果
- 使用 stderr 输出调试日志

## 详细参考

- 工具设计详解：见 [references/tool-design.md](references/tool-design.md)
- Server 模板代码：见 [scripts/server-template.ts](scripts/server-template.ts)
