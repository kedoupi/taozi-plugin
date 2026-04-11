#!/usr/bin/env node
/**
 * evaluate-session.js
 * 会话结束时评估是否有值得学习的模式
 *
 * 触发: SessionEnd (Stop event)
 * 1. 统计对话轮数
 * 2. 少于 5 轮则跳过
 * 3. 写入元数据到 $TAOZI_HOME/learned/（默认 ~/.taozi/learned/）
 * 4. 超过 100 文件时清理旧条目
 * 5. 始终 exit(0)
 */

const fs = require('fs');
const path = require('path');
const {
  readStdinJson,
  warn,
  ensureDir,
  readJson,
  writeJson,
  getDateString,
  getLearnedDir,
  isGitRepo,
  getGitModifiedFiles,
} = require('../lib/utils');

const MAX_ITEMS = 100;

const input = readStdinJson();
const learnedDir = getLearnedDir();
ensureDir(learnedDir);

// --- 1. 统计对话轮数 ---
// input 来自 SessionEnd hook，包含会话信息
// 尝试从 input 中计算用户消息数
let turnCount = 0;
let topicHint = 'unknown';

if (input) {
  // 如果有 conversation 历史，计算用户消息数
  if (Array.isArray(input.conversation)) {
    turnCount = input.conversation.filter(
      (msg) => msg.role === 'user'
    ).length;
  } else if (typeof input.turn_count === 'number') {
    turnCount = input.turn_count;
  } else {
    // 无法精确计算时，假设有效（宁可多学）
    turnCount = 10;
  }

  // 尝试提取主题提示
  if (input.topic_hint) {
    topicHint = input.topic_hint;
  } else if (Array.isArray(input.conversation) && input.conversation.length > 0) {
    // 取第一条用户消息的前 80 字符作为主题提示
    const firstUserMsg = input.conversation.find((m) => m.role === 'user');
    if (firstUserMsg && firstUserMsg.content) {
      const content = typeof firstUserMsg.content === 'string'
        ? firstUserMsg.content
        : JSON.stringify(firstUserMsg.content);
      topicHint = content.slice(0, 80).replace(/\n/g, ' ');
    }
  }
}

// --- 2. 少于 5 轮则跳过 ---
if (turnCount < 5) {
  warn(`[Learn] 会话仅 ${turnCount} 轮对话，跳过学习评估`);
  process.exit(0);
}

// --- 3. 检查 git 变更 ---
let hasGitChanges = false;
const cwd = process.cwd();
if (isGitRepo(cwd)) {
  const modified = getGitModifiedFiles(cwd);
  hasGitChanges = modified.length > 0;
}

// --- 4. 写入学习记录 ---
const dateStr = getDateString();
const filePath = path.join(learnedDir, `${dateStr}.json`);

// 如果当天已有记录，合并（取最新的）
const existing = readJson(filePath);
const now = new Date();

const record = {
  date: dateStr,
  timestamp: now.getTime(),
  hasGitChanges,
  topicHint,
  turnCount,
};

if (existing) {
  // 保留 existing 中的 patterns 数组（如果有）
  if (Array.isArray(existing.patterns) && existing.patterns.length > 0) {
    record.patterns = existing.patterns;
  }
  // 当本次会话没有拿到有效主题时，回退到当天已有主题。
  if (record.topicHint === 'unknown' && existing.topicHint && existing.topicHint !== 'unknown') {
    record.topicHint = existing.topicHint;
  }
}

writeJson(filePath, record);
warn(`[Learn] 会话已记录: ${turnCount} 轮, topic: ${topicHint.slice(0, 40)}`);

// --- 5. 清理旧条目 ---
try {
  const files = fs.readdirSync(learnedDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({
      name: f,
      path: path.join(learnedDir, f),
      data: readJson(path.join(learnedDir, f)),
    }))
    .filter((f) => f.data !== null)
    .sort((a, b) => (b.data.timestamp || 0) - (a.data.timestamp || 0));

  if (files.length > MAX_ITEMS) {
    const toDelete = files.slice(MAX_ITEMS);
    for (const file of toDelete) {
      try {
        fs.unlinkSync(file.path);
      } catch {
        // Best effort
      }
    }
    warn(`[Learn] 已清理 ${toDelete.length} 条旧记录`);
  }
} catch {
  // Best effort cleanup
}

process.exit(0);
