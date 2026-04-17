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

- 需求不明确或要选工作流：`taozi`
- 需要先拆计划：`plan`
- 需要并行协作：`multi-plan` / `multi-execute`
- 改完后做验证：`verify`
- 做 review 或发布前检查：`code-review`、`quality-gate`
- Git 提交、PR、worktree：`git-workflow`
- 更新长期上下文：`update-context`
- 选择模型策略：`model-route`
- 沉淀经验和检查点：`learning`

## Taozi State

- Taozi runtime data lives in `$TAOZI_HOME` when set.
- Default Taozi home is `~/.taozi`.
- Legacy Claude installs still read from `~/.claude/taozi` as a fallback.

## Maintenance

- Keep Claude-specific files under `.claude-plugin/` and `hooks/`.
- Keep Codex-specific files under `.codex/`, `.codex-plugin/`, and `.agents/`.
- Shared content should live in canonical source directories, then be adapted or generated for each runtime.
