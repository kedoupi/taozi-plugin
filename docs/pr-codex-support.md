# PR: Add Codex Support For Taozi

## Title

`feat: add Codex support for Taozi`

## Summary

Add first-class Codex support to Taozi while keeping Claude Code support in the same repository.

## Changes

- add shared runtime guidance via `AGENTS.md`
- add Codex runtime/config/plugin surfaces under `.codex/`, `.codex-plugin/`, and `.agents/`
- add `scripts/sync-codex.js` to generate Codex-facing agents and mirrored skills from canonical `agents/` and `skills/`
- add Codex-native Taozi workflow skills for routing, planning, TDD, verification, review, quality gate, Git workflow, context update, model route, multi-agent, and learning
- update Taozi runtime storage to prefer `TAOZI_HOME`, default to `~/.taozi`, and fall back to legacy `~/.claude/taozi`
- update docs and release tooling to cover Codex support
- add Codex regression tests, including sync preservation and TOML validation
- validate the Claude install path in a temporary local-scope smoke project

## Test Plan

- run `node scripts/sync-codex.js`
- run `node tests/run-all.js`
- run `claude plugins validate .claude-plugin/plugin.json`
- run `claude plugins validate .claude-plugin/marketplace.json`
- smoke test Codex repo-local loading with `codex exec --ephemeral -s read-only ...`
- smoke test Claude local-scope install in a temporary project

## Reviewer Notes

- `agents/` and `skills/` remain the source of truth
- `.codex/agents/` and `.agents/skills/` are generated artifacts
- `scripts/sync-codex.js` now preserves hand-written Codex-only files via sync manifests instead of clearing whole directories
- Codex tests now run sync preservation checks in isolated temporary copies to avoid mutating the real generated directories during test execution
