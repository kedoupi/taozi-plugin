#!/usr/bin/env node
/**
 * git-commit-guard.js
 * 拦截裸 git commit，强制走 /taozi:commit skill 流程
 *
 * exit(0) = 放行
 * exit(2) = 拦截（仅 PreToolUse 有效，stderr 内容作为 Claude 的反馈）
 */

const { readStdinJson, error } = require('../lib/utils');

const input = readStdinJson();
if (!input || !input.tool_input) {
  process.exit(0);
}

const command = input.tool_input.command || '';

// 匹配 git commit（排除 git commit-tree / git commit-graph 等子命令）
const isGitCommit = /\bgit\s+commit\b(?!-)/.test(command);

if (isGitCommit) {
  // 放行已符合 emoji + conventional 格式的 commit（说明已走过 skill 流程）
  // 必须匹配：<emoji> <type>(<scope>)?: <subject>
  // 仅命令里任意位置出现 emoji 并不足够（例如 "git commit -m 'random 😀'" 不应放行）
  const conventionalWithEmoji =
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}][️‍]?\s*(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert|wip)(\([^)]+\))?:\s+\S/u;
  if (conventionalWithEmoji.test(command)) {
    process.exit(0);
  }

  error('');
  error('========================================');
  error('  BLOCKED: 请使用 /taozi:commit 提交');
  error('========================================');
  error('');
  error('直接执行 git commit 已被拦截。');
  error('请调用 /taozi:commit skill 完成提交流程：');
  error('');
  error('  → 暂存检查 → emoji + 约定式格式 → 自动拆分提交');
  error('');
  error('调用方式：invoke the "commit" skill (taozi:commit)');
  error('');
  process.exit(2);
}

process.exit(0);
