#!/usr/bin/env node
/**
 * pre-compact.js
 * 压缩前保存关键上下文提醒
 *
 * 始终 exit(0)
 */

const { readStdinJson, warn } = require('../lib/utils');

const input = readStdinJson();

warn('');
warn('=== Pre-Compact Context Preservation ===');
warn('');
warn('Before context is compressed, make sure to preserve:');
warn('');
warn('1. Active file paths currently being edited');
warn('2. Current task description and progress');
warn('3. Key design decisions made so far');
warn('4. Unresolved errors or blockers');
warn('5. Branch name and commit state');
warn('');
warn('These should be captured in the compressed context summary.');
warn('');

process.exit(0);
