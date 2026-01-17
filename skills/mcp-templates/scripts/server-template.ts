/**
 * MCP Server 模板
 * 使用方法：复制此文件并根据需求修改
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// 创建 Server 实例
const server = new Server(
  {
    name: "my-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// ==================== 工具定义 ====================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "example_tool",
        description: "示例工具 - 描述工具的功能",
        inputSchema: {
          type: "object",
          properties: {
            param1: {
              type: "string",
              description: "必填参数描述",
            },
            param2: {
              type: "number",
              description: "可选参数描述，默认值 10",
            },
          },
          required: ["param1"],
        },
      },
    ],
  };
});

// ==================== 工具处理 ====================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  console.error(`[DEBUG] Tool called: ${name}`, args);

  try {
    switch (name) {
      case "example_tool": {
        const param1 = args?.param1 as string;
        const param2 = (args?.param2 as number) ?? 10;

        // 实现你的逻辑
        const result = {
          message: `处理参数: ${param1}`,
          count: param2,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`[ERROR] Tool error:`, error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// ==================== 资源定义（可选） ====================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "config://settings",
        name: "配置信息",
        description: "服务器配置",
        mimeType: "application/json",
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "config://settings") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify({ version: "1.0.0" }),
        },
      ],
    };
  }

  throw new Error(`Resource not found: ${uri}`);
});

// ==================== 启动服务 ====================

async function main() {
  console.error("[INFO] Starting MCP server...");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[INFO] MCP server started");
}

main().catch((error) => {
  console.error("[FATAL] Server failed to start:", error);
  process.exit(1);
});
