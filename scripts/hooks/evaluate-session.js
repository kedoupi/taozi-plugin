#!/usr/bin/env node
/**
 * evaluate-session.js
 * 会话结束时评估是否有值得学习的模式
 *
 * 触发: SessionEnd (Stop event)
 * 1. 读取会话元数据（Stop 事件不含 conversation/turn_count，无法门控）
 * 2. 检查 git 变更
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

// --- 1. 读取元数据 ---
// Stop 事件不提供 conversation 或 turn_count，用 session_id 作为标识
let topicHint = 'unknown';
const turnCount = 0; // Stop 事件无法获得轮数，作为元数据保留但不用于门控

if (input && input.topic_hint) {
  topicHint = input.topic_hint;
}

// --- 2. 检查 git 变更 ---
let hasGitChanges = false;
const cwd = process.cwd();
if (isGitRepo(cwd)) {
  const modified = getGitModifiedFiles(cwd);
  hasGitChanges = modified.length > 0;
}

// --- 3. 写入学习记录 ---
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

// --- 4. 清理旧条目 ---
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
