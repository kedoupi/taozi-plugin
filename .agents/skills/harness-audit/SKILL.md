---
name: harness-audit
description: 审计 Claude Code 插件配置 — Hooks、Rules、Skills、MCP 健康检查
allowed-tools: Read, Grep, Glob, Bash
---

# Harness Audit

对 Taozi 插件的完整配置进行健康检查和审计。

## 何时使用

- 插件升级或重构后需要整体体检
- 发布前校验配置一致性
- 用户明确要求"审计 harness"、"检查插件配置"

## 审计原则

- 审计不修改任何文件，只报告状态
- 区分"错误"（必须修复）和"建议"（可选改进）
- 检查文件引用的一致性
- 发现配置冲突时标明冲突位置

## 审计范围

### 1. Hooks 检查

```bash
ls -la hooks/
cat hooks/hooks.json | python3 -m json.tool > /dev/null 2>&1 && echo "JSON 有效"
```

审查项：
- [ ] hooks.json 是合法 JSON
- [ ] 每个 hook 有 name、type、command 字段
- [ ] command 引用的脚本文件存在
- [ ] 脚本文件有执行权限
- [ ] 没有重复的 hook name
- [ ] 匹配规则（pattern/glob）合理

### 2. Rules 检查

```bash
ls -la rules/{common,typescript,python,golang,swift}/
```

审查项：
- [ ] 每个语言目录有对应的规则文件
- [ ] 每个文件以 `> 本文件扩展 [common/xxx.md]` 开头
- [ ] 引用的 common 文件存在
- [ ] 规则内容与描述匹配
- [ ] 无重复或冲突的规则
- [ ] Markdown 格式正确

### 3. Skills 检查

```bash
ls -la skills/
for f in skills/*/SKILL.md; do
  echo "--- $f ---"
  head -5 "$f"
done
```

审查项：
- [ ] 每个 skill 目录下有 SKILL.md
- [ ] frontmatter 包含 name、description
- [ ] skill 名称无冲突
- [ ] skill 内容有执行步骤

### 4. Plugin.json 检查

```bash
cat .claude-plugin/plugin.json | python3 -m json.tool > /dev/null
cat .codex-plugin/plugin.json | python3 -m json.tool > /dev/null
```

审查项：
- [ ] plugin.json 是合法 JSON
- [ ] 声明的目录都实际存在
- [ ] 两个 plugin.json 的 version 一致
- [ ] description 在两处同步

### 5. MCP 健康检查

```bash
cat .mcp.json 2>/dev/null || echo "无 .mcp.json"
```

审查项：
- [ ] MCP 配置格式正确
- [ ] 每个 server 有 command 字段
- [ ] 引用的命令/脚本路径存在
- [ ] 环境变量引用有效
- [ ] 无不必要的 MCP server

### 6. 测试状态

```bash
node tests/run-all.js
npm run lint
```

审查项：
- [ ] 全部测试通过
- [ ] lint 通过
- [ ] CI 配置正确

## 报告格式

```markdown
## 插件审计报告

### 概览

| 组件 | 数量 | 状态 |
|------|------|------|
| Hooks | X | PASS/FAIL |
| Rules | X | PASS/FAIL |
| Skills | X | PASS/FAIL |
| Plugin.json | — | PASS/FAIL |
| MCP | X | PASS/FAIL |
| Tests | X | PASS/FAIL |

### 问题列表
1. [严重] [问题描述] — [修复建议]
2. [警告] [问题描述] — [修复建议]

### 配置统计
- 总规则文件 / Skill / MCP Server 数

### 总体状态
✅ 全部通过 / ⚠️ 存在警告 / ❌ 存在严重问题
```
