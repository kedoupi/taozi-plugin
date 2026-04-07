---
name: harness-audit
description: 审计 Claude Code 插件配置 — Hooks、Rules、Skills、MCP 健康检查
allowed-tools: Read, Grep, Glob, Bash
argument-hint:
---

# 插件配置审计

对 Taozi 插件的完整配置进行健康检查和审计。

## 审计范围

### 1. Hooks 检查

```bash
# 检查 hooks 目录结构
ls -la hooks/

# 检查 hooks.json 格式有效性
cat hooks/hooks.json | python3 -m json.tool > /dev/null 2>&1 && echo "JSON 有效" || echo "JSON 无效"
```

审查项：

```markdown
### Hooks 审查
- [ ] hooks.json 是合法 JSON
- [ ] 每个 hook 有 name、type、command 字段
- [ ] command 引用的脚本文件存在
- [ ] 脚本文件有执行权限
- [ ] 没有重复的 hook name
- [ ] 匹配规则（pattern/glob）合理
```

### 2. Rules 检查

```bash
# 检查 rules 目录结构
ls -la rules/
ls -la rules/typescript/
ls -la rules/python/
ls -la rules/golang/
ls -la rules/swift/
```

审查项：

```markdown
### Rules 审查
- [ ] 每个语言目录有 5 个规则文件
- [ ] 每个文件以 `> 本文件扩展 [common/xxx.md](../xxx.md)` 开头
- [ ] 引用的 common 文件存在
- [ ] 规则内容与描述匹配
- [ ] 无重复或冲突的规则
- [ ] Markdown 格式正确
```

### 3. Skills 检查

```bash
# 检查 skills 目录结构
ls -la skills/

# 检查 skill 文件格式
for f in skills/*.md; do
  echo "--- $f ---"
  head -5 "$f"
done
```

审查项：

```markdown
### Skills 审查
- [ ] 每个 skill 文件有 YAML frontmatter
- [ ] frontmatter 包含 name、description、trigger 字段
- [ ] skill 名称无冲突
- [ ] trigger 条件合理（不会误触发）
- [ ] skill 内容有执行步骤
```

### 4. Commands 检查

```bash
# 检查 commands 目录
ls -la commands/

# 验证每个命令的 frontmatter
for f in commands/*.md; do
  echo "--- $f ---"
  head -6 "$f" | grep -E "^(name|description|allowed-tools):"
done
```

审查项：

```markdown
### Commands 审查
- [ ] 每个命令有 YAML frontmatter
- [ ] frontmatter 包含 name、description、allowed-tools
- [ ] allowed-tools 列表合理（最小权限原则）
- [ ] 命令名称无冲突
- [ ] argument-hint 描述准确
```

### 5. MCP 健康检查

```bash
# 检查 MCP 配置
cat .mcp.json 2>/dev/null || echo "无 .mcp.json"
cat ~/.claude/settings.json 2>/dev/null | python3 -c "
import json, sys
d = json.load(sys.stdin)
for name, conf in d.get('mcpServers', {}).items():
    print(f'{name}: {\"command\" in conf}')
"
```

审查项：

```markdown
### MCP 审查
- [ ] MCP 配置文件格式正确
- [ ] 每个 server 配置有 command 字段
- [ ] 引用的命令/脚本路径存在
- [ ] 环境变量引用有效
- [ ] 无不必要的 MCP server
```

### 6. 测试状态

```bash
# 检查测试文件
ls -la tests/

# 如果有测试脚本
if [ -f "tests/run_tests.sh" ]; then
    bash tests/run_tests.sh
fi
```

审查项：

```markdown
### 测试审查
- [ ] 测试文件存在
- [ ] 测试可以执行
- [ ] 测试覆盖了核心功能
- [ ] CI 配置正确（如果有）
```

## 报告格式

```markdown
## 插件审计报告

### 概览
| 组件 | 数量 | 状态 |
|------|------|------|
| Hooks | X | PASS/FAIL |
| Rules (common) | X | PASS/FAIL |
| Rules (TypeScript) | X | PASS/FAIL |
| Rules (Python) | X | PASS/FAIL |
| Rules (Go) | X | PASS/FAIL |
| Rules (Swift) | X | PASS/FAIL |
| Skills | X | PASS/FAIL |
| Commands | X | PASS/FAIL |
| MCP | X | PASS/FAIL |
| Tests | X | PASS/FAIL |

### 问题列表
1. [严重] [问题描述] — [修复建议]
2. [警告] [问题描述] — [修复建议]
3. [信息] [建议内容]

### 配置统计
- 总规则文件: X
- 总命令: X
- 总 Skill: X
- MCP Server: X

### 总体状态
✅ 全部通过 / ⚠️ 存在警告 / ❌ 存在严重问题
```

## 重要原则

- 审计不修改任何文件，只报告状态
- 区分"错误"（必须修复）和"建议"（可选改进）
- 检查文件引用的一致性
- 如果发现配置冲突，标明冲突位置
