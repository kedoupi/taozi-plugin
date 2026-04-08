# MCP 配置

将所需 MCP Server 配置合并到 `~/.claude/settings.json` 的 `mcpServers` 字段中。

## 可用配置

| 文件 | 服务 | 用途 |
|------|------|------|
| `github.json` | GitHub | 读写 Issues/PR/代码，自动化 Git 工作流 |
| `supabase.json` | Supabase | 数据库操作、Auth、Storage、Edge Functions |
| `vercel.json` | Vercel | 部署管理、环境变量、日志查看 |

## 安装方式

### 单个配置（推荐）

```bash
# 以 GitHub 为例
cat mcp-configs/github.json
```

将内容合并到 `~/.claude/settings.json`：

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

### 环境变量设置

```bash
# 添加到 ~/.zshrc 或 ~/.bashrc
export GITHUB_TOKEN="ghp_your_token_here"
export SUPABASE_ACCESS_TOKEN="your_supabase_token"
export VERCEL_TOKEN="your_vercel_token"
```

## 所需权限

### GitHub Token
- `repo`：读写代码和 Issues
- `workflow`：管理 Actions（可选）

### Supabase Token
- Supabase Dashboard → Account → Access Tokens

### Vercel Token
- Vercel Dashboard → Settings → Tokens
