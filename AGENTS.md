# Taozi For Codex

Taozi now supports both Claude Code and Codex from the same repository.

## Source Of Truth

- `agents/` is the canonical home for Taozi agent role definitions.
- `skills/` is the canonical home for reusable Taozi skills.
- `.codex/agents/` and `.agents/skills/` are generated Codex-facing artifacts.
- Run `node scripts/sync-codex.js` after changing `agents/` or `skills/`.

## Runtime Expectations

- Use Taozi workflows as Codex-native `skills` and `subagents`, not as Claude slash commands.
- Prefer the generated `.codex/agents/*` custom agents when a task clearly matches their specialty.
- Keep changes minimal and do not revert unrelated user edits.
- Validate touched code paths before finishing when the task changes code.

## Quick Routing

- 需求不明确或要选工作流：`taozi-router`
- 需要先拆计划：`taozi-plan`
- 需要并行协作：`taozi-multi-agent`
- 改完后做验证：`taozi-verify`
- 做 review 或发布前检查：`taozi-code-review`、`taozi-quality-gate`
- Git 提交、PR、worktree：`taozi-git-workflow`
- 更新长期上下文：`taozi-context-update`
- 选择模型策略：`taozi-model-route`
- 沉淀经验和检查点：`taozi-learning`

## Taozi State

- Taozi runtime data lives in `$TAOZI_HOME` when set.
- Default Taozi home is `~/.taozi`.
- Legacy Claude installs still read from `~/.claude/taozi` as a fallback.

## Maintenance

- Keep Claude-specific files under `.claude-plugin/`, `commands/`, and `hooks/`.
- Keep Codex-specific files under `.codex/`, `.codex-plugin/`, and `.agents/`.
- Shared content should live in canonical source directories, then be adapted or generated for each runtime.
