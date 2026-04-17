---
name: checkpoint
description: 保存当前工作状态检查点，用于跨会话恢复
allowed-tools: Read, Write, Bash, Grep, Glob
argument-hint: [检查点描述]
---

# Checkpoint

保存当前工作状态到检查点文件，以便新会话恢复上下文。描述: `$ARGUMENTS`。

## 何时使用

- 长任务中段，即将切换会话或关机
- 复杂调研、多步实现需要在新窗口延续
- 用户明确要求"保存进度"、"创建检查点"

## 保存原则

- 描述要具体，不要写"继续工作"，要写"用户认证模块 - 完成 JWT 签发"
- 包含恢复指南，让新会话能快速理解上下文
- 不记录敏感信息（密码、token）
- 保持检查点文件简洁，不超过 100 行

## 执行步骤

### 1. 收集当前状态

```bash
git branch --show-current          # 当前分支
git status --porcelain             # 未提交变更
git log -5 --oneline               # 最近提交
git stash list                     # stash 列表
pwd                                # 工作目录
```

### 2. 识别活跃文件

- 读取过的文件
- 修改过的文件
- 创建过的文件

### 3. 记录未完成任务

- 已完成步骤
- 正在进行的工作
- 待完成步骤
- 阻塞点

### 4. 记录关键决策

- 选择了什么方案
- 为什么这样选
- trade-off 是什么

### 5. 保存检查点

```bash
TAOZI_DIR="${TAOZI_HOME:-$HOME/.taozi}"
mkdir -p "$TAOZI_DIR/checkpoints"
# 文件名格式: YYYY-MM-DD-HHMM-<description>.md
```

### 检查点文件格式

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
- 分支 / 未提交变更数 / 最近提交

## 活跃文件
### 已修改
- `path/to/file.ts` — [修改内容摘要]
### 已创建
- `path/to/new-file.ts` — [用途]

## 进度
### 已完成
- [x] 步骤 1
### 进行中
- [ ] 步骤 3（进度 50%）
### 待完成
- [ ] 步骤 4

## 关键决策
1. [决策 1]: 原因是 ...

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

- 文件: ${TAOZI_HOME:-$HOME/.taozi}/checkpoints/<filename>.md
- 分支 / 进度 / 未提交变更数

### 恢复方式
新会话中说: "恢复检查点 <filename>"
```
