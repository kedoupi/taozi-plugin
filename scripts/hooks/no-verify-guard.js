#!/usr/bin/env node
/**
 * no-verify-guard.js
 * 阻止 git --no-verify 标志 — 铁律 1 强制执行：调试铁律
 *
 * exit(2) = BLOCK the tool call
 * exit(0) = allow
 */

const { readStdinJson, error } = require('../lib/utils');

const input = readStdinJson();
if (!input || !input.tool_input) {
  process.exit(0);
}

const command = input.tool_input.command || '';
const isGitCommand = /\bgit\b/.test(command);
const hasNoVerify = /--no-verify\b/.test(command);

if (isGitCommand && hasNoVerify) {
  error('');
  error('========================================');
  error('  BLOCKED: --no-verify 标志被禁止');
  error('========================================');
  error('');
  error('铁律 1 — 调试铁律: NO FIXES WITHOUT ROOT CAUSE');
  error('');
  error('--no-verify 跳过 git hooks 意味着：');
  error('  - 可能绕过 lint 检查');
  error('  - 可能绕过测试验证');
  error('  - 隐藏了真正的问题');
  error('');
  error('正确做法：');
  error('  1. 找到 hook 失败的根因');
  error('  2. 修复根因');
  error('  3. 正常提交让 hooks 通过');
  error('');
  process.exit(2);
}

process.exit(0);
