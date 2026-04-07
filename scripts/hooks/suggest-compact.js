#!/usr/bin/env node
/**
 * suggest-compact.js
 * 每编辑 15 个文件后建议压缩上下文
 *
 * 触发: PostToolUse on Edit|Write
 * 使用 ~/.claude/taozi/edit-counter.json 追踪编辑次数
 * 始终 exit(0)
 */

const path = require('path');
const os = require('os');
const {
  readStdinJson,
  warn,
  ensureDir,
  readJson,
  writeJson,
  getTaoziDir,
} = require('../lib/utils');

const COMPACT_INTERVAL = 15;
const COUNTER_FILE = path.join(getTaoziDir(), 'edit-counter.json');

// 读取当前输入
const input = readStdinJson();

// 只对 Edit 和 Write 工具触发
if (input && input.tool_name) {
  const toolName = input.tool_name;
  if (toolName !== 'Edit' && toolName !== 'Write') {
    process.exit(0);
  }
}

// 读取计数器
const counter = readJson(COUNTER_FILE) || { count: 0, lastCompact: null };

// 递增计数
counter.count = (counter.count || 0) + 1;

// 检查是否达到阈值
if (counter.count >= COMPACT_INTERVAL) {
  warn('');
  warn('========================================');
  warn(`  已编辑 ${counter.count} 个文件，建议压缩上下文`);
  warn('========================================');
  warn('');
  warn('触发条件: 已编辑 ' + COMPACT_INTERVAL + ' 个文件');
  warn('');
  warn('建议操作:');
  warn('  1. 确认当前进度已保存');
  warn('  2. 记住关键文件路径和设计决策');
  warn('  3. 执行 /compact 或等待自动压缩');
  warn('');

  // 重置计数器
  counter.count = 0;
  counter.lastCompact = new Date().toISOString();
}

// 保存计数器
ensureDir(getTaoziDir());
writeJson(COUNTER_FILE, counter);

process.exit(0);
