#!/usr/bin/env node
/**
 * session-start.js
 * 会话启动时加载上次上下文
 *
 * 始终 exit(0)
 */

const fs = require('fs');
const path = require('path');
const { readStdinJson, warn, ensureDir, readJson, getSessionsDir } = require('../lib/utils');

const sessionsDir = getSessionsDir();
ensureDir(sessionsDir);

// Find latest session file
let latestSession = null;
let latestTime = 0;

try {
  const files = fs.readdirSync(sessionsDir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(sessionsDir, file);
    const data = readJson(filePath);
    if (data && data.timestamp > latestTime) {
      latestTime = data.timestamp;
      latestSession = data;
    }
  }
} catch {
  // No sessions yet
}

if (latestSession) {
  const date = new Date(latestSession.timestamp);
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = date.toISOString().slice(11, 19);

  warn('');
  warn(`Last session: ${dateStr} ${timeStr}`);
  if (latestSession.duration) {
    warn(`Duration: ${Math.round(latestSession.duration / 60)} min`);
  }
  warn('');
}

process.exit(0);
