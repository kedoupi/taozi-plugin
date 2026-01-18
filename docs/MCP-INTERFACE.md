# MCP 接口设计文档

> Taozi Plugin 的 MCP (Model Context Protocol) 化准备

## 概述

本文档定义了 Taozi Plugin 向 MCP 标准化转换的接口设计，为未来将工作流和 Agent 能力暴露为 MCP Tools 做准备。

## 核心接口定义

### 工作流执行接口

```typescript
/**
 * 工作流执行请求
 */
interface WorkflowExecution {
  /** 工作流名称 */
  workflow: string;
  /** 执行输入 */
  input: {
    /** 需求描述 */
    requirement: string;
    /** 附加上下文 */
    context?: Record<string, any>;
    /** 执行选项 */
    options?: {
      /** 执行模式: 顺序或并行 */
      mode: 'sequential' | 'parallel';
      /** 最大步骤数 */
      maxSteps?: number;
      /** 是否跳过测试步骤 */
      skipTests?: boolean;
    };
  };
}

/**
 * Agent 执行结果
 */
interface AgentResult {
  /** Agent 名称 */
  agent: string;
  /** 执行状态 */
  status: 'success' | 'failed' | 'partial';
  /** 执行输出 */
  output: {
    /** 发现和分析 */
    findings: string[];
    /** 建议和方案 */
    recommendations: string[];
    /** 生成的文件路径 */
    artifacts?: string[];
  };
  /** 传递给下一步的上下文 */
  context: Record<string, any>;
  /** 执行耗时 (ms) */
  duration?: number;
}

/**
 * 完整工作流结果
 */
interface WorkflowResult {
  /** 工作流名称 */
  workflow: string;
  /** 执行状态 */
  status: 'success' | 'failed' | 'partial';
  /** 各步骤结果 */
  steps: AgentResult[];
  /** 总结摘要 */
  summary: string;
  /** 后续建议 */
  nextSteps: string[];
  /** 总耗时 (ms) */
  totalDuration: number;
}
```

### 直接调度接口

```typescript
/**
 * Agent 直接调度请求
 */
interface AgentExecution {
  /** Agent 名称 */
  agent: string;
  /** 任务描述 */
  task: string;
  /** 附加上下文 */
  context?: Record<string, any>;
  /** 引用的 Skills */
  skills?: string[];
}
```

## MCP Tool 设计

### 工作流 Tools

每个工作流将作为独立的 MCP Tool 暴露：

```typescript
// feature-development Tool
const featureDevelopmentTool = {
  name: "taozi_feature_development",
  description: "新功能端到端开发工作流，从需求分析到测试覆盖",
  inputSchema: {
    type: "object",
    properties: {
      requirement: {
        type: "string",
        description: "功能需求描述"
      },
      techStack: {
        type: "array",
        items: { type: "string" },
        description: "技术栈约束 (可选)"
      },
      skipTests: {
        type: "boolean",
        description: "是否跳过测试步骤",
        default: false
      }
    },
    required: ["requirement"]
  }
};

// bug-fixing Tool
const bugFixingTool = {
  name: "taozi_bug_fixing",
  description: "Bug 诊断与修复工作流",
  inputSchema: {
    type: "object",
    properties: {
      bugDescription: {
        type: "string",
        description: "Bug 描述"
      },
      errorMessage: {
        type: "string",
        description: "错误信息 (可选)"
      },
      reproductionSteps: {
        type: "array",
        items: { type: "string" },
        description: "复现步骤 (可选)"
      }
    },
    required: ["bugDescription"]
  }
};

// code-review Tool
const codeReviewTool = {
  name: "taozi_code_review",
  description: "代码审查工作流，覆盖质量和安全",
  inputSchema: {
    type: "object",
    properties: {
      scope: {
        type: "string",
        enum: ["recent", "branch", "files"],
        description: "审查范围"
      },
      files: {
        type: "array",
        items: { type: "string" },
        description: "指定文件列表 (scope=files 时必填)"
      },
      baseBranch: {
        type: "string",
        description: "对比的基准分支 (scope=branch 时使用)"
      }
    },
    required: ["scope"]
  }
};

// performance-tuning Tool
const performanceTuningTool = {
  name: "taozi_performance_tuning",
  description: "性能优化工作流",
  inputSchema: {
    type: "object",
    properties: {
      issue: {
        type: "string",
        description: "性能问题描述"
      },
      targetMetric: {
        type: "string",
        description: "目标性能指标 (可选)"
      },
      area: {
        type: "string",
        enum: ["frontend", "backend", "database", "all"],
        description: "优化区域"
      }
    },
    required: ["issue"]
  }
};

// refactoring Tool
const refactoringTool = {
  name: "taozi_refactoring",
  description: "代码重构工作流",
  inputSchema: {
    type: "object",
    properties: {
      target: {
        type: "string",
        description: "重构目标（文件/模块/功能）"
      },
      goal: {
        type: "string",
        description: "重构目的 (可选)"
      }
    },
    required: ["target"]
  }
};

// documentation Tool
const documentationTool = {
  name: "taozi_documentation",
  description: "技术文档编写工作流",
  inputSchema: {
    type: "object",
    properties: {
      docType: {
        type: "string",
        enum: ["readme", "api", "architecture", "guide", "comment"],
        description: "文档类型"
      },
      target: {
        type: "string",
        description: "文档化目标"
      },
      audience: {
        type: "string",
        description: "目标读者 (可选)"
      }
    },
    required: ["docType", "target"]
  }
};
```

### 智能调度 Tool

```typescript
// 统一入口 Tool
const taoziDispatchTool = {
  name: "taozi_dispatch",
  description: "Taozi 智能调度 - 自动分析任务并选择最佳工作流或 Agent",
  inputSchema: {
    type: "object",
    properties: {
      task: {
        type: "string",
        description: "任务描述"
      },
      preferWorkflow: {
        type: "boolean",
        description: "优先匹配工作流",
        default: true
      }
    },
    required: ["task"]
  }
};
```

## 资源定义 (Resources)

### Skills 资源
```typescript
const skillsResource = {
  uri: "taozi://skills",
  name: "Taozi Skills Library",
  description: "领域知识库 - Claude 根据任务自动引用",
  mimeType: "application/json"
};
```

### Agents 资源
```typescript
const agentsResource = {
  uri: "taozi://agents",
  name: "Taozi Agents Registry",
  description: "可用 Agent 列表及其能力",
  mimeType: "application/json"
};
```

## 实现路线图

### Phase 1: 接口标准化 (当前)
- [x] 定义标准化输入输出格式
- [x] Agent 结果格式统一
- [x] 工作流上下文传递机制

### Phase 2: MCP Server 实现
- [ ] 创建 MCP Server 框架
- [ ] 实现 Tool 注册机制
- [ ] 实现 Resource 提供机制

### Phase 3: Tool 实现
- [ ] 实现各工作流 Tool
- [ ] 实现智能调度 Tool
- [ ] 添加错误处理和重试

### Phase 4: 集成测试
- [ ] 单元测试各 Tool
- [ ] 集成测试工作流
- [ ] 性能测试

## MCP Server 示例代码

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "taozi-mcp-server", version: "2.1.0" },
  { capabilities: { tools: {}, resources: {} } }
);

// 注册工作流 Tools
server.setRequestHandler("tools/list", async () => ({
  tools: [
    featureDevelopmentTool,
    bugFixingTool,
    codeReviewTool,
    performanceTuningTool,
    refactoringTool,
    documentationTool,
    taoziDispatchTool,
  ]
}));

// 处理 Tool 调用
server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "taozi_feature_development":
      return executeWorkflow("feature-development", args);
    case "taozi_bug_fixing":
      return executeWorkflow("bug-fixing", args);
    case "taozi_dispatch":
      return dispatch(args.task);
    // ... 其他 tools
  }
});

// 启动 Server
const transport = new StdioServerTransport();
await server.connect(transport);
```

## 错误处理

```typescript
interface TaoziError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

const ErrorCodes = {
  WORKFLOW_NOT_FOUND: "WORKFLOW_NOT_FOUND",
  AGENT_NOT_FOUND: "AGENT_NOT_FOUND",
  EXECUTION_FAILED: "EXECUTION_FAILED",
  INVALID_INPUT: "INVALID_INPUT",
  TIMEOUT: "TIMEOUT",
} as const;
```

## 监控和日志

```typescript
interface ExecutionLog {
  id: string;
  timestamp: string;
  type: "workflow" | "agent";
  name: string;
  input: Record<string, any>;
  output?: AgentResult | WorkflowResult;
  error?: TaoziError;
  duration: number;
}
```

## 未来扩展

1. **多语言支持**: 支持 Python, Go 等语言的 MCP Client
2. **远程执行**: 支持分布式 Agent 执行
3. **版本管理**: 工作流和 Agent 版本控制
4. **权限控制**: 细粒度的 Tool 访问控制
5. **使用分析**: 收集使用统计和优化建议
