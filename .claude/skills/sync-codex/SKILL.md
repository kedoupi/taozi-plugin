---
name: sync-codex
description: 将 agents/ 和 skills/ 的变更同步到 Codex 适配层（.codex/agents/ 和 .agents/skills/）。修改 agents/ 或 skills/ 后必须调用。
---

执行 Codex 同步：

```bash
node scripts/sync-codex.js
```

完成后确认：
- 同步了多少个 agents 和 skills
- 如果有报错，列出具体错误
- 提醒：`.codex-plugin/plugin.json` 的 version/description 不会自动同步，如果本次涉及版本升级，需要手动更新
