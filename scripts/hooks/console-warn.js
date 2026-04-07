#!/usr/bin/env node
/**
 * console-warn.js
 * 编辑后检测 console.log 语句
 *
 * 始终 exit(0) — 非阻断，仅警告
 */

const fs = require('fs');
const { readStdinJson, warn } = require('../lib/utils');

const input = readStdinJson();
if (!input || !input.tool_input) {
  process.exit(0);
}

const filePath = input.tool_input.file_path || '';
const codeExts = ['.ts', '.tsx', '.js', '.jsx'];

const ext = codeExts.find((e) => filePath.endsWith(e));
if (!ext) {
  process.exit(0);
}

let content;
try {
  content = fs.readFileSync(filePath, 'utf8');
} catch {
  // File might not be readable yet (e.g. file was just created but not flushed)
  process.exit(0);
}

const lines = content.split('\n');
const consoleLogLines = [];

for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  // Skip comments
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
    continue;
  }
  if (/\bconsole\.log\s*\(/.test(lines[i])) {
    consoleLogLines.push(i + 1);
  }
}

if (consoleLogLines.length > 0) {
  warn('');
  warn(`Found console.log in ${filePath}`);
  warn(`  Lines: ${consoleLogLines.join(', ')}`);
  warn('  Consider removing before commit, or use a proper logger.');
  warn('');
}

process.exit(0);
