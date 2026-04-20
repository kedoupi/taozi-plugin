---
name: commit
description: Git 提交助手 — 分析 staged diff，按 emoji + Conventional Commits 生成提交信息。检测未暂存变更并建议拆分提交。
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git branch:*), Read
---

# Commit

生成符合 Taozi 规范的 git commit。完整规范（emoji/type/分支名/行为约束）见 [git-conventions](../git-conventions/SKILL.md)。

## 流程

### 1. 收集状态

按需运行（不要全部一次性跑）：

```bash
git branch --show-current
git status --porcelain
git diff --cached --stat
```

若 `--cached --stat` 为空 → 当前没有暂存任何变更，进入步骤 2。否则跳到步骤 3。

### 2. 暂存（仅当无 staged 时）

- 列出未暂存的变更文件，问用户：全部 `git add -A` 还是按文件挑选？
- 不要替用户决定，等用户回应后再 `git add`。

### 3. 分析与拆分

```bash
git diff --cached
```

判断是否需要拆分：

- 多个**逻辑无关**的改动 → 建议拆分，每次 `git reset HEAD <path>` 取出再单独 commit
- 同一逻辑的多文件改动 → 单个 commit 即可

### 4. 生成提交信息

格式：`<emoji> <type>: <description>`

- 现在时祈使语气（"添加" 而非 "添加了"）
- 第一行 ≤ 72 字符
- description 写**为什么**，不写**是什么**（diff 已展示是什么）
- emoji + type 对照表见 [git-conventions](../git-conventions/SKILL.md)

### 5. 执行

```bash
git commit -m "$(cat <<'EOF'
<emoji> <type>: <description>

<可选 body：背景、动机、影响>
EOF
)"
```

## 禁止（commit 专属）

- 禁止 `--no-verify` 跳过 hook
- 禁止把无关改动塞进同一个 commit

## 失败回退

- pre-commit hook 失败 → 修复底层问题后**新建 commit**，不要 `--amend`
- 用户拒绝建议的信息 → 让用户改写，不要硬推
