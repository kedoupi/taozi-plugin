---
name: checkpoint
description: 保存当前工作状态检查点，用于跨会话恢复
allowed-tools: Read, Write, Bash, Grep, Glob
argument-hint: [检查点描述]
---

# 检查点保存

保存当前工作状态到检查点文件，以便在新的会话中恢复上下文。

## 执行步骤

### 1. 收集当前状态

自动采集以下信息：

```bash
# Git 状态
git branch --show-current          # 当前分支
git status --porcelain             # 未提交变更
git log -5 --oneline               # 最近提交
git stash list                     # stash 列表

# 当前目录
pwd                                # 工作目录
```

### 2. 识别活跃文件

从本次会话中识别操作过的文件：

- 读取过的文件列表
- 修改过的文件列表
- 创建过的文件列表

### 3. 记录未完成任务

梳理当前工作进度：

- 已完成的步骤
- 正在进行的工作
- 待完成的步骤
- 遇到的阻塞点

### 4. 记录关键决策

列出本次会话中做出的重要技术决策：

- 选择了什么方案
- 为什么这样选择
- 有什么 trade-off

### 5. 保存检查点

将完整状态写入 `~/.claude/taozi/checkpoints/` 目录：

```bash
# 确保目录存在
mkdir -p ~/.claude/taozi/checkpoints

# 生成文件名（日期 + 描述）
# 格式: YYYY-MM-DD-HHMM-<description>.md
# 例如: 2026-04-07-1430-user-auth-module.md
```

检查点文件格式：

```markdown
---
created: YYYY-MM-DD HH:MM
branch: <当前分支>
description: $ARGUMENTS
---

# 检查点: [描述]

## 工作目录
`<当前路径>`

## Git 状态
- 分支: `<branch>`
- 未提交变更: <数量>
- 最近提交:
  - `<hash> <message>`

## 活跃文件
### 已修改
- `path/to/file.ts` — [修改内容摘要]
### 已创建
- `path/to/new-file.ts` — [用途]

## 进度
### 已完成
- [x] 步骤 1
- [x] 步骤 2
### 进行中
- [ ] 步骤 3（进度 50%）
### 待完成
- [ ] 步骤 4
- [ ] 步骤 5

## 关键决策
1. [决策 1]: 原因是 ...
2. [决策 2]: 原因是 ...

## 阻塞点
- [如果有]

## 恢复指南
1. 切换到分支: `git checkout <branch>`
2. 查看未提交变更: `git status`
3. 继续的下一步: [具体描述]
```

### 6. 报告

```markdown
## 检查点已保存

- 文件: ~/.claude/taozi/checkpoints/<filename>.md
- 分支: <branch>
- 进度: <已完成>/<总步骤>
- 未提交变更: <数量>

### 恢复方式
在新的会话中说：
"恢复检查点 <filename>"
或
"查看 ~/.claude/taozi/checkpoints/ 中的检查点"
```

## 重要原则

- 检查点描述要具体，不要写"继续工作"，要写"用户认证模块 - 完成 JWT 签发"
- 包含恢复指南，让新会话能快速理解上下文
- 不记录敏感信息（密码、token）
- 保持检查点文件简洁，不超过 100 行
