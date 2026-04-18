#!/usr/bin/env node
/**
 * block-random-md.js
 * 阻止随意创建 .md 文件
 *
 * exit(0) — 非阻断，仅警告（建议 Claude 不要随意创建 md 文件）
 */

const path = require('path');
const { readStdinJson, warn } = require('../lib/utils');

const input = readStdinJson();
if (!input || !input.tool_input) {
  process.exit(0);
}

const filePath = input.tool_input.file_path || '';

if (!filePath.endsWith('.md')) {
  process.exit(0);
}

const basename = path.basename(filePath, '.md');
const lower = basename.toLowerCase();

// Junk file patterns
const junkPatterns = [
  /^untitled/i,
  /^notes?$/i,
  /^temp(orary)?$/i,
  /^draft$/i,
  /^scratch$/i,
  /^misc$/i,
  /^random/i,
  /^todo$/i,
  /^\d{4,}$/, // just numbers
  /^copy\b/i,
  /^backup/i,
  /^test$/i,
  /^new\s+file/i,
];

const isJunk = junkPatterns.some((p) => p.test(basename));

// Allowlisted directories
const allowedDirs = ['docs', 'skills', '.claude', 'agents', 'rules'];
const dirParts = filePath.split(path.sep);
const isInAllowedDir = dirParts.some((part) => allowedDirs.includes(part));

// Also allow if it's a README at any level
const isReadme = /^readme/i.test(basename);

if (isReadme || isInAllowedDir) {
  process.exit(0);
}

if (isJunk) {
  warn('');
  warn(`Suspicious .md file creation detected: ${filePath}`);
  warn('  Filename looks like a junk/temp file. Avoid creating ad-hoc .md files.');
  warn('  If this is intentional, place it in docs/ or use a meaningful name.');
  warn('');
} else {
  // Non-junk named .md outside allowed dirs — soft warning
  warn('');
  warn(`Creating .md file: ${filePath}`);
  warn('  Only create .md files in docs/, skills/, or .claude/ directories.');
  warn('');
}

process.exit(0);
