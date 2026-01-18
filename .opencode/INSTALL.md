# Taozi Plugin for OpenCode

## 安装

### 方式 1: 一键安装（推荐）

```bash
curl -fsSL https://raw.githubusercontent.com/kedoupi/taozi-plugin/main/install.sh | bash
```

### 方式 2: 手动安装

```bash
# 1. 克隆到 OpenCode 配置目录
mkdir -p ~/.config/opencode
git clone https://github.com/kedoupi/taozi-plugin.git ~/.config/opencode/taozi

# 2. 创建插件链接
mkdir -p ~/.config/opencode/plugins
ln -sf ~/.config/opencode/taozi/.opencode/plugin/taozi.js ~/.config/opencode/plugins/taozi.js
```

## 验证安装

```bash
# 测试插件
node ~/.config/opencode/plugins/taozi.js info

# 列出 Agent
node ~/.config/opencode/plugins/taozi.js call find_agents

# 使用 Agent
node ~/.config/opencode/plugins/taozi.js call use_agent '{"name":"fullstack-developer"}'
```

## 使用方法

插件注册了以下工具供 OpenCode 使用:

| 工具 | 功能 |
|------|------|
| `find_agents` | 列出所有可用的 Agent |
| `use_agent` | 使用指定的 Agent |
| `find_skills` | 列出所有可用的 Skill |
| `use_skill` | 使用指定的 Skill |

### 在 OpenCode 中使用

```
> 帮我重构这段代码

[OpenCode 调用 find_agents 发现可用 Agent]
[OpenCode 调用 use_agent refactoring-specialist 获取专业指导]
[根据 Agent 指导进行重构]
```

## 更新

```bash
cd ~/.config/opencode/taozi && git pull
```

## 卸载

```bash
rm ~/.config/opencode/plugins/taozi.js
rm -rf ~/.config/opencode/taozi
```

## 配置

### 自定义安装目录

设置 `TAOZI_DIR` 环境变量:

```bash
export TAOZI_DIR=/path/to/taozi
```

### 插件 API

插件导出以下接口:

```javascript
const { plugin, systemPrompt, tools } = require('./taozi.js');

// plugin - 插件元信息
// systemPrompt - 会话启动时的系统提示
// tools - 工具定义数组
```

## 故障排除

### 插件未加载

1. 检查链接是否正确:
   ```bash
   ls -la ~/.config/opencode/plugins/taozi.js
   ```

2. 检查目标文件是否存在:
   ```bash
   ls -la ~/.config/opencode/taozi/.opencode/plugin/taozi.js
   ```

### 找不到 Agent

确保 agents 目录存在:
```bash
ls ~/.config/opencode/taozi/agents/
```

## 相关链接

- [Taozi Plugin 主仓库](https://github.com/kedoupi/taozi-plugin)
- [OpenCode](https://github.com/opencode-ai/opencode)
