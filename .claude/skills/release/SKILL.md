---
name: release
description: 执行 taozi-plugin 完整发版流程：三处版本号同步、CHANGELOG 更新、README 检查、sync-codex、全量测试、两个 git commit、询问是否推送远程
---

发版工作流。按以下步骤执行，每步完成后报告结果，遇到失败立即停止并告知原因。

## 步骤

### 1. 确认版本号

询问用户新版本号（如 `3.5.0`），或从上下文中读取。

### 2. 三处版本号同步

必须同步以下三个文件的 `version` 字段和 `description` 字段（description 中的版本号也要更新）：

1. `package.json` → `version`
2. `.claude-plugin/plugin.json` → `version` + `description`
3. `.codex-plugin/plugin.json` → `version` + `description`

验证：
```bash
grep '"version"' package.json .claude-plugin/plugin.json .codex-plugin/plugin.json
```
预期三处相同。

### 3. 更新 CHANGELOG.md

在 `CHANGELOG.md` 顶部插入新版本条目（格式参照现有条目）：
- 日期用今天的日期
- 分 Added / Fixed / Changed 三节，只写有实质内容的节

### 4. 检查并更新 README.md

```bash
ls skills/ | wc -l
```

对照 README.md 中的以下内容逐一验证，有过时则更新：

1. **Skills 总数**：`## Skills（N 个）` 和 `### 工作流 Skills（N 个）` 要与 `ls skills/ | wc -l` 一致
2. **工作流 Skills 列表**：`skills/` 目录下新增的可触发 skill 是否已加入列表
3. **YouMind 创作 Skills 描述**：`/taozi:wechat` 和 `/taozi:xiaohongshu` 等描述是否反映了本次新增能力
4. **版本号**：README 首行 `# Taozi Plugin X.Y.Z` 已由步骤 2 更新，确认即可

### 5. 运行全量测试

```bash
node tests/run-all.js
```

必须全绿（0 失败）才能继续。

### 6. Sync Codex

```bash
node scripts/sync-codex.js
```

### 7. 再次运行测试（sync 后确认）

```bash
node tests/run-all.js
```

### 8. 两个 git commit

**提交 1 — 基础设施**（版本号 + 文档）：
```bash
git add package.json .claude-plugin/plugin.json .codex-plugin/plugin.json CHANGELOG.md README.md
git commit -m "chore: 升级至 <VERSION>"
```

**提交 2 — 功能代码**（新增的 skills/agents/hooks/tests/sync 产物等）：
```bash
git add <新增和修改的功能文件>
git commit -m "feat: <主要功能描述>"
```

如果本次没有新功能文件（纯 bugfix 或文档），合并为一个 commit。

### 9. 完成报告

列出：版本号、两个 commit hash、测试通过数量。

### 10. 推送到远程仓库

询问用户是否推送到远程：

> 本次发版 commit 已就绪，是否推送到远程仓库？
> `git push origin main`

用户确认后执行：
```bash
git push origin main
```

推送完成后确认：`git log --oneline origin/main..main` 应输出空（本地与远程已同步）。
