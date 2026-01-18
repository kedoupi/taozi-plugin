# Taozi Plugin for Codex

## 安装

### 方式 1: 一键安装（推荐）

```bash
curl -fsSL https://raw.githubusercontent.com/kedoupi/taozi-plugin/main/install.sh | bash
```

### 方式 2: 手动安装

```bash
# 1. 克隆到 Codex 配置目录
mkdir -p ~/.codex
git clone https://github.com/kedoupi/taozi-plugin.git ~/.codex/taozi

# 2. 初始化（生成 AGENTS.md）
~/.codex/taozi/.codex/taozi-codex bootstrap
```

## 验证安装

```bash
# 检查 AGENTS.md 是否生成
cat ~/.codex/AGENTS.md

# 列出 Agent
~/.codex/taozi/.codex/taozi-codex find-agents

# 使用 Agent
~/.codex/taozi/.codex/taozi-codex use-agent fullstack-developer
```

## 使用方法

### CLI 命令

```bash
# 列出所有 Agent
taozi-codex find-agents

# 使用指定 Agent（输出其内容供 LLM 使用）
taozi-codex use-agent <name>

# 列出所有 Skill
taozi-codex find-skills

# 使用指定 Skill
taozi-codex use-skill <name>

# JSON 格式输出
taozi-codex find-agents --json
```

### 在 Codex 中使用

在 Codex 会话中，让 AI 运行以下命令:

```
请运行 ~/.codex/taozi/.codex/taozi-codex find-agents 查看可用的专家 Agent
```

或者:

```
我需要优化前端性能，请先运行 taozi-codex use-agent performance-engineer 获取专业指导
```

### 添加别名（可选）

在 `~/.bashrc` 或 `~/.zshrc` 中添加:

```bash
alias taozi-codex='~/.codex/taozi/.codex/taozi-codex'
```

## 可用 Agent (10 个核心)

| 分类 | Agent | 用途 |
|------|-------|------|
| 执行层 | fullstack-developer | 端到端开发 |
| 执行层 | devops-engineer | CI/CD、Docker |
| 执行层 | debugger | Bug 诊断 |
| 质量层 | code-reviewer | 代码审查 |
| 质量层 | testing-engineer | 测试策略 |
| 优化层 | refactoring-specialist | 代码重构 |
| 优化层 | performance-engineer | 性能优化 |
| 支撑层 | documentation-engineer | 技术文档 |
| 支撑层 | context-manager | 上下文管理 |
| 支撑层 | prompt-engineer | LLM 提示 |

## 更新

```bash
cd ~/.codex/taozi && git pull
~/.codex/taozi/.codex/taozi-codex bootstrap
```

## 卸载

```bash
rm -rf ~/.codex/taozi
rm ~/.codex/AGENTS.md
```

## 配置

### 自定义安装目录

设置 `TAOZI_DIR` 环境变量:

```bash
export TAOZI_DIR=/path/to/taozi
```

## 故障排除

### 命令找不到

确保使用完整路径:
```bash
~/.codex/taozi/.codex/taozi-codex find-agents
```

或添加别名（见上文）。

### 找不到 Agent

确保 agents 目录存在:
```bash
ls ~/.codex/taozi/agents/
```

### AGENTS.md 为空

重新运行 bootstrap:
```bash
~/.codex/taozi/.codex/taozi-codex bootstrap
```

## 相关链接

- [Taozi Plugin 主仓库](https://github.com/kedoupi/taozi-plugin)
- [Codex CLI](https://github.com/openai/codex)
