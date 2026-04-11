#!/usr/bin/env node
/**
 * tmux-hint.js
 * 检测 dev server 命令，建议使用 tmux
 *
 * 始终 exit(0) — 非阻断，仅提示
 */

const { readStdinJson, warn } = require('../lib/utils');

const input = readStdinJson();
if (!input || !input.tool_input) {
  process.exit(0);
}

const command = input.tool_input.command || '';

const devPatterns = [
  /\bnpm\s+run\s+dev\b/,
  /\bpnpm\s+(run\s+)?dev\b/,
  /\byarn\s+(run\s+)?dev\b/,
  /\bbun\s+(run\s+)?dev\b/,
  /\bnpx\s+(?:next\s+dev|vite(?:\s+--host)?|webpack(?:-dev-server)?\s+serve)\b/,
  /\bpython\s+-m\s+(?:http\.server|uvicorn)\b/,
  /\bgit\s+server\b/,
  /\bnpm\s+start\b/,
  /\bpnpm\s+start\b/,
];

const isDevServer = devPatterns.some((p) => p.test(command));

if (isDevServer) {
  warn('');
  warn('Hint: Dev server detected. Consider using tmux:');
  warn('  tmux new -s dev    # create session');
  warn('  tmux attach -t dev # reattach later');
  warn('  Ctrl+B, D          # detach without stopping');
  warn('');
}

process.exit(0);
