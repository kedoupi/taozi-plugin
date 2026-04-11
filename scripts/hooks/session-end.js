#!/usr/bin/env node
/**
 * session-end.js
 * 会话结束时保存状态
 *
 * 保留最近 10 个 session 文件
 */

const fs = require('fs');
const path = require('path');
const { readStdinJson, ensureDir, readJson, writeJson, getSessionsDir, getDateTimeString } = require('../lib/utils');

const MAX_SESSIONS = 10;

const input = readStdinJson();
const sessionsDir = getSessionsDir();
ensureDir(sessionsDir);

// Build session metadata
const now = new Date();
const session = {
  date: now.toISOString().split('T')[0],
  timestamp: now.getTime(),
  datetime: getDateTimeString(),
};

// Persist the session id when the host provides one.
if (input && input.session_id) {
  session.session_id = input.session_id;
}

// Write session file
const fileName = `session-${getDateTimeString()}.json`;
const filePath = path.join(sessionsDir, fileName);
writeJson(filePath, session);

// Prune old sessions, keep only the latest MAX_SESSIONS
try {
  const files = fs.readdirSync(sessionsDir)
    .filter((f) => f.startsWith('session-') && f.endsWith('.json'))
    .map((f) => ({
      name: f,
      path: path.join(sessionsDir, f),
      data: readJson(path.join(sessionsDir, f)),
    }))
    .filter((f) => f.data !== null)
    .sort((a, b) => (b.data.timestamp || 0) - (a.data.timestamp || 0));

  if (files.length > MAX_SESSIONS) {
    const toDelete = files.slice(MAX_SESSIONS);
    for (const file of toDelete) {
      try {
        fs.unlinkSync(file.path);
      } catch {
        // Best effort
      }
    }
  }
} catch {
  // Best effort pruning
}

process.exit(0);
