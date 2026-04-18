#!/usr/bin/env node
/**
 * hooks.test.js — Hooks 系统测试
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const PLUGIN_ROOT = path.resolve(__dirname, '../..');
const HOOKS_DIR = path.join(PLUGIN_ROOT, 'scripts', 'hooks');
const HOOKS_JSON = path.join(PLUGIN_ROOT, 'hooks', 'hooks.json');

// --- Helper ---

function runHook(scriptPath, stdinData, options = {}) {
  const result = spawnSync('node', [scriptPath], {
    input: JSON.stringify(stdinData),
    cwd: options.cwd,
    encoding: 'utf8',
    timeout: 5000,
    env: {
      ...process.env,
      ...(options.env || {}),
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status,
    signal: result.signal,
    error: result.error || null,
  };
}

function initGitRepo(repoPath) {
  fs.mkdirSync(repoPath, { recursive: true });
  const result = spawnSync('git', ['init'], {
    cwd: repoPath,
    encoding: 'utf8',
    timeout: 5000,
  });
  assert.strictEqual(result.status, 0, result.stderr || result.stdout || 'git init failed');
}

// =====================
// 1. hooks.json 结构
// =====================

test('hooks.json is valid JSON', () => {
  const content = fs.readFileSync(HOOKS_JSON, 'utf8');
  const parsed = JSON.parse(content);
  assert(parsed.hooks, 'Missing top-level "hooks" key');
});

test('hooks.json has all required event types', () => {
  const content = fs.readFileSync(HOOKS_JSON, 'utf8');
  const parsed = JSON.parse(content);
  const events = ['PreToolUse', 'PostToolUse', 'SessionStart', 'Stop', 'PreCompact'];
  for (const event of events) {
    assert(Array.isArray(parsed.hooks[event]), `Missing or not array: hooks.${event}`);
  }
});

test('each hook has id, matcher, hooks array, description', () => {
  const content = fs.readFileSync(HOOKS_JSON, 'utf8');
  const parsed = JSON.parse(content);
  for (const [event, hooks] of Object.entries(parsed.hooks)) {
    assert(Array.isArray(hooks), `hooks.${event} should be an array`);
    for (const hook of hooks) {
      assert(hook.id, `Hook in ${event} missing "id"`);
      assert(typeof hook.matcher === 'string', `Hook ${hook.id} missing "matcher"`);
      assert(Array.isArray(hook.hooks), `Hook ${hook.id} missing "hooks" array`);
      assert(hook.description, `Hook ${hook.id} missing "description"`);
      for (const h of hook.hooks) {
        assert(h.type === 'command', `Hook ${hook.id} sub-hook must have type "command"`);
        assert(h.command, `Hook ${hook.id} sub-hook missing "command"`);
      }
    }
  }
});

test('each hook script file exists on disk', () => {
  const content = fs.readFileSync(HOOKS_JSON, 'utf8');
  const parsed = JSON.parse(content);
  for (const [event, hooks] of Object.entries(parsed.hooks)) {
    for (const hook of hooks) {
      for (const h of hook.hooks) {
        // Extract script path from command like: node "${CLAUDE_PLUGIN_ROOT}/scripts/hooks/xxx.js"
        const match = h.command.match(/scripts\/hooks\/([^"]+)/);
        assert(match, `Cannot extract script name from command: ${h.command}`);
        const scriptPath = path.join(PLUGIN_ROOT, 'scripts', 'hooks', match[1]);
        assert(fs.existsSync(scriptPath), `Script not found: ${scriptPath}`);
      }
    }
  }
});

// =====================
// 2. no-verify-guard
// =====================

test('no-verify-guard blocks git --no-verify', () => {
  const script = path.join(HOOKS_DIR, 'no-verify-guard.js');
  const result = runHook(script, {
    tool_input: { command: 'git commit --no-verify -m "fix"' },
  });
  assert.strictEqual(result.status, 2, 'Should exit(2) for --no-verify');
});

test('no-verify-guard blocks git commit --no-verify (with other flags)', () => {
  const script = path.join(HOOKS_DIR, 'no-verify-guard.js');
  const result = runHook(script, {
    tool_input: { command: 'git commit --no-verify --amend -m "fix"' },
  });
  assert.strictEqual(result.status, 2, 'Should exit(2) for --no-verify');
});

test('no-verify-guard allows normal git commit', () => {
  const script = path.join(HOOKS_DIR, 'no-verify-guard.js');
  const result = runHook(script, {
    tool_input: { command: 'git commit -m "fix: something"' },
  });
  assert.strictEqual(result.status, 0, 'Should exit(0) for normal git commit');
});

test('no-verify-guard allows non-git commands', () => {
  const script = path.join(HOOKS_DIR, 'no-verify-guard.js');
  const result = runHook(script, {
    tool_input: { command: 'npm install lodash' },
  });
  assert.strictEqual(result.status, 0, 'Should exit(0) for non-git commands');
});

test('no-verify-guard handles null stdin', () => {
  const script = path.join(HOOKS_DIR, 'no-verify-guard.js');
  // Pass empty object — readStdinJson should handle gracefully
  const result = runHook(script, {});
  assert.strictEqual(result.status, 0, 'Should exit(0) for empty input');
});

test('no-verify-guard handles missing tool_input', () => {
  const script = path.join(HOOKS_DIR, 'no-verify-guard.js');
  const result = runHook(script, { some_other_key: true });
  assert.strictEqual(result.status, 0, 'Should exit(0) for missing tool_input');
});

test('no-verify-guard allows --no-verify inside commit message string', () => {
  const script = path.join(HOOKS_DIR, 'no-verify-guard.js');
  const result = runHook(script, {
    tool_input: { command: 'git commit -m "removed --no-verify from CI pipeline"' },
  });
  assert.strictEqual(result.status, 0, 'Should exit(0) when --no-verify is inside -m "..."');
});

test('no-verify-guard still blocks --no-verify flag outside quotes', () => {
  const script = path.join(HOOKS_DIR, 'no-verify-guard.js');
  const result = runHook(script, {
    tool_input: { command: "git commit -m 'fix issue' --no-verify" },
  });
  assert.strictEqual(result.status, 2, 'Should exit(2) when --no-verify is a real flag');
});

// =====================
// 3. tmux-hint
// =====================

test('tmux-hint detects npm run dev', () => {
  const script = path.join(HOOKS_DIR, 'tmux-hint.js');
  const result = runHook(script, {
    tool_input: { command: 'npm run dev' },
  });
  assert.strictEqual(result.status, 0, 'Should exit(0) always');
  // stderr should contain tmux hint
  assert(result.stderr.includes('tmux'), 'Should mention tmux');
});

test('tmux-hint detects pnpm dev', () => {
  const script = path.join(HOOKS_DIR, 'tmux-hint.js');
  const result = runHook(script, {
    tool_input: { command: 'pnpm dev' },
  });
  assert.strictEqual(result.status, 0, 'Should exit(0)');
  assert(result.stderr.includes('tmux'), 'Should mention tmux');
});

test('tmux-hint detects python -m http.server', () => {
  const script = path.join(HOOKS_DIR, 'tmux-hint.js');
  const result = runHook(script, {
    tool_input: { command: 'python -m http.server 8000' },
  });
  assert.strictEqual(result.status, 0, 'Should exit(0)');
  assert(result.stderr.includes('tmux'), 'Should mention tmux');
});

test('tmux-hint does not trigger on ls', () => {
  const script = path.join(HOOKS_DIR, 'tmux-hint.js');
  const result = runHook(script, {
    tool_input: { command: 'ls -la' },
  });
  assert.strictEqual(result.status, 0, 'Should exit(0)');
  assert(!result.stderr.includes('tmux'), 'Should not mention tmux for ls');
});

test('tmux-hint does not trigger on npx prettier', () => {
  const script = path.join(HOOKS_DIR, 'tmux-hint.js');
  const result = runHook(script, {
    tool_input: { command: 'npx prettier --check .' },
  });
  assert.strictEqual(result.status, 0, 'Should exit(0)');
  assert(!result.stderr.includes('tmux'), 'Should not mention tmux for formatter commands');
});

test('tmux-hint does not trigger on python -m pytest', () => {
  const script = path.join(HOOKS_DIR, 'tmux-hint.js');
  const result = runHook(script, {
    tool_input: { command: 'python -m pytest' },
  });
  assert.strictEqual(result.status, 0, 'Should exit(0)');
  assert(!result.stderr.includes('tmux'), 'Should not mention tmux for test commands');
});

// =====================
// 4. console-warn
// =====================

test('console-warn detects console.log in .ts file', () => {
  const script = path.join(HOOKS_DIR, 'console-warn.js');
  // Create a temp .ts file with console.log
  const tmpFile = path.join(os.tmpdir(), `test-console-warn-${Date.now()}.ts`);
  fs.writeFileSync(tmpFile, 'console.log("hello");\nconst x = 1;\nconsole.log("world");\n');
  try {
    const result = runHook(script, {
      tool_input: { file_path: tmpFile },
    });
    assert.strictEqual(result.status, 0, 'Should exit(0) always');
    assert(result.stderr.includes('console.log'), 'Should warn about console.log');
    assert(result.stderr.includes('Lines: 1, 3'), 'Should report correct line numbers');
  } finally {
    fs.unlinkSync(tmpFile);
  }
});

test('console-warn skips .css files', () => {
  const script = path.join(HOOKS_DIR, 'console-warn.js');
  const result = runHook(script, {
    tool_input: { file_path: '/some/path/style.css' },
  });
  assert.strictEqual(result.status, 0, 'Should exit(0)');
  assert(!result.stderr.includes('console.log'), 'Should not warn for .css files');
});

test('console-warn skips commented console.log', () => {
  const script = path.join(HOOKS_DIR, 'console-warn.js');
  const tmpFile = path.join(os.tmpdir(), `test-console-warn-comment-${Date.now()}.ts`);
  fs.writeFileSync(tmpFile, '// console.log("this is commented");\nconst x = 1;\n');
  try {
    const result = runHook(script, {
      tool_input: { file_path: tmpFile },
    });
    assert.strictEqual(result.status, 0, 'Should exit(0)');
    assert(!result.stderr.includes('console.log'), 'Should not warn for commented lines');
  } finally {
    fs.unlinkSync(tmpFile);
  }
});

test('console-warn skips console.log inside strings', () => {
  const script = path.join(HOOKS_DIR, 'console-warn.js');
  const tmpFile = path.join(os.tmpdir(), `test-console-warn-string-${Date.now()}.ts`);
  fs.writeFileSync(tmpFile, 'const msg = "console.log(\\"hello\\")";\nconst x = 1;\n');
  try {
    const result = runHook(script, {
      tool_input: { file_path: tmpFile },
    });
    assert.strictEqual(result.status, 0, 'Should exit(0)');
    assert.strictEqual(result.signal, null, 'Should not be terminated by signal');
    assert(!result.stderr.includes('console.log'), 'Should not warn for string literals');
  } finally {
    fs.unlinkSync(tmpFile);
  }
});

// =====================
// 5. block-random-md
// =====================

test('block-random-md warns on UNTITLED.md', () => {
  const script = path.join(HOOKS_DIR, 'block-random-md.js');
  const result = runHook(script, {
    tool_input: { file_path: '/tmp/UNTITLED.md' },
  });
  assert.strictEqual(result.status, 0, 'Should exit(0)');
  assert(result.stderr.includes('Suspicious'), 'Should warn about junk file');
});

test('block-random-md warns on temp.md', () => {
  const script = path.join(HOOKS_DIR, 'block-random-md.js');
  const result = runHook(script, {
    tool_input: { file_path: '/home/user/temp.md' },
  });
  assert.strictEqual(result.status, 0, 'Should exit(0)');
  assert(result.stderr.includes('Suspicious') || result.stderr.includes('.md'), 'Should warn');
});

test('block-random-md allows docs/ path', () => {
  const script = path.join(HOOKS_DIR, 'block-random-md.js');
  const result = runHook(script, {
    tool_input: { file_path: '/project/docs/notes.md' },
  });
  assert.strictEqual(result.status, 0, 'Should exit(0)');
  assert(!result.stderr.includes('Suspicious'), 'Should not warn for docs/ path');
});

test('block-random-md allows README.md', () => {
  const script = path.join(HOOKS_DIR, 'block-random-md.js');
  const result = runHook(script, {
    tool_input: { file_path: '/project/README.md' },
  });
  assert.strictEqual(result.status, 0, 'Should exit(0)');
  assert(!result.stderr.includes('Suspicious'), 'Should allow README');
});

test('block-random-md ignores non-.md files', () => {
  const script = path.join(HOOKS_DIR, 'block-random-md.js');
  const result = runHook(script, {
    tool_input: { file_path: '/tmp/UNTITLED.ts' },
  });
  assert.strictEqual(result.status, 0, 'Should exit(0)');
  assert(!result.stderr.includes('.md'), 'Should not warn for non-.md files');
});

// =====================
// 6. session-start
// =====================

test('session-start runs without error', () => {
  const script = path.join(HOOKS_DIR, 'session-start.js');
  const taoziHome = path.join(os.tmpdir(), `taozi-session-start-${Date.now()}`);
  const result = runHook(script, {}, { env: { TAOZI_HOME: taoziHome } });
  assert.strictEqual(result.status, 0, 'Should exit(0)');
});

test('session-start ignores non-session json files', () => {
  const script = path.join(HOOKS_DIR, 'session-start.js');
  const taoziHome = path.join(os.tmpdir(), `taozi-session-start-filter-${Date.now()}`);
  const sessionsDir = path.join(taoziHome, 'sessions');

  try {
    fs.mkdirSync(sessionsDir, { recursive: true });
    fs.writeFileSync(
      path.join(sessionsDir, 'not-a-session.json'),
      JSON.stringify({ timestamp: Date.now() + 1000000 }),
      'utf8'
    );
    fs.writeFileSync(
      path.join(sessionsDir, 'session-real.json'),
      JSON.stringify({ timestamp: Date.now() - 1000 }),
      'utf8'
    );

    const result = runHook(script, {}, { env: { TAOZI_HOME: taoziHome } });
    assert.strictEqual(result.status, 0, 'Should exit(0)');
    assert(result.stderr.includes('Last session'), 'Should still report real session file');
  } finally {
    fs.rmSync(taoziHome, { recursive: true, force: true });
  }
});

test('session-start does not print duration for current session metadata', () => {
  const script = path.join(HOOKS_DIR, 'session-start.js');
  const taoziHome = path.join(os.tmpdir(), `taozi-session-start-duration-${Date.now()}`);
  const sessionsDir = path.join(taoziHome, 'sessions');

  try {
    fs.mkdirSync(sessionsDir, { recursive: true });
    fs.writeFileSync(
      path.join(sessionsDir, 'session-real.json'),
      JSON.stringify({ timestamp: Date.now() }),
      'utf8'
    );

    const result = runHook(script, {}, { env: { TAOZI_HOME: taoziHome } });
    assert.strictEqual(result.status, 0, 'Should exit(0)');
    assert(!result.stderr.includes('Duration:'), 'Should not print unused duration field');
  } finally {
    fs.rmSync(taoziHome, { recursive: true, force: true });
  }
});

// =====================
// 7. session-end
// =====================

test('session-end creates session file', () => {
  const script = path.join(HOOKS_DIR, 'session-end.js');
  const taoziHome = path.join(os.tmpdir(), `taozi-session-end-${Date.now()}`);
  const result = runHook(script, {}, { env: { TAOZI_HOME: taoziHome } });
  assert.strictEqual(result.status, 0, 'Should exit(0)');

  // Verify a session file was created
  const sessionsDir = path.join(taoziHome, 'sessions');
  assert(fs.existsSync(sessionsDir), 'Sessions directory should exist');
  const files = fs.readdirSync(sessionsDir).filter((f) => f.startsWith('session-') && f.endsWith('.json'));
  assert(files.length > 0, 'At least one session file should exist');
});

test('session-end persists session_id when provided', () => {
  const script = path.join(HOOKS_DIR, 'session-end.js');
  const taoziHome = path.join(os.tmpdir(), `taozi-session-end-id-${Date.now()}`);

  try {
    const result = runHook(script, { session_id: 'session-123' }, { env: { TAOZI_HOME: taoziHome } });
    assert.strictEqual(result.status, 0, 'Should exit(0)');

    const sessionsDir = path.join(taoziHome, 'sessions');
    const files = fs.readdirSync(sessionsDir).filter((f) => f.startsWith('session-') && f.endsWith('.json'));
    assert.strictEqual(files.length, 1, 'Should create one session file');

    const session = JSON.parse(fs.readFileSync(path.join(sessionsDir, files[0]), 'utf8'));
    assert.strictEqual(session.session_id, 'session-123');
    assert.strictEqual(session.duration, undefined, 'Should not invent duration field');
  } finally {
    fs.rmSync(taoziHome, { recursive: true, force: true });
  }
});

test('evaluate-session keeps newer topicHint when current session is more specific', () => {
  const script = path.join(HOOKS_DIR, 'evaluate-session.js');
  const taoziHome = path.join(os.tmpdir(), `taozi-evaluate-topic-${Date.now()}`);
  const learnedDir = path.join(taoziHome, 'learned');

  try {
    fs.mkdirSync(learnedDir, { recursive: true });
    const today = new Date().toISOString().split('T')[0];
    fs.writeFileSync(
      path.join(learnedDir, `${today}.json`),
      JSON.stringify({ timestamp: Date.now() - 1000, topicHint: 'old topic', turnCount: 8 }, null, 2),
      'utf8'
    );

    const result = runHook(
      script,
      { turn_count: 8, topic_hint: 'new topic' },
      { env: { TAOZI_HOME: taoziHome } }
    );
    assert.strictEqual(result.status, 0, 'Should exit(0)');

    const record = JSON.parse(fs.readFileSync(path.join(learnedDir, `${today}.json`), 'utf8'));
    assert.strictEqual(record.topicHint, 'new topic');
  } finally {
    fs.rmSync(taoziHome, { recursive: true, force: true });
  }
});

test('evaluate-session falls back to existing topicHint when current session is unknown', () => {
  const script = path.join(HOOKS_DIR, 'evaluate-session.js');
  const taoziHome = path.join(os.tmpdir(), `taozi-evaluate-fallback-${Date.now()}`);
  const learnedDir = path.join(taoziHome, 'learned');

  try {
    fs.mkdirSync(learnedDir, { recursive: true });
    const today = new Date().toISOString().split('T')[0];
    fs.writeFileSync(
      path.join(learnedDir, `${today}.json`),
      JSON.stringify({ timestamp: Date.now() - 1000, topicHint: 'old topic', turnCount: 8 }, null, 2),
      'utf8'
    );

    const result = runHook(
      script,
      { turn_count: 8 },
      { env: { TAOZI_HOME: taoziHome } }
    );
    assert.strictEqual(result.status, 0, 'Should exit(0)');

    const record = JSON.parse(fs.readFileSync(path.join(learnedDir, `${today}.json`), 'utf8'));
    assert.strictEqual(record.topicHint, 'old topic');
  } finally {
    fs.rmSync(taoziHome, { recursive: true, force: true });
  }
});

test('evaluate-session Stop 事件无 turn_count 时仍写 learned 记录', () => {
  const script = path.join(HOOKS_DIR, 'evaluate-session.js');
  const taoziHome = path.join(os.tmpdir(), `taozi-evaluate-no-turn-${Date.now()}`);
  const learnedDir = path.join(taoziHome, 'learned');

  try {
    fs.mkdirSync(learnedDir, { recursive: true });
    const result = runHook(script, {}, { env: { TAOZI_HOME: taoziHome } });
    assert.strictEqual(result.status, 0, 'Should exit(0)');
    const files = fs.readdirSync(learnedDir);
    // Stop 事件不含 conversation/turn_count，但仍写记录（不做轮数门控）
    assert.strictEqual(files.length, 1, 'Should write learned record regardless of turnCount');
  } finally {
    fs.rmSync(taoziHome, { recursive: true, force: true });
  }
});

test('suggest-compact 对同一文件重复编辑不重复计数', () => {
  const script = path.join(HOOKS_DIR, 'suggest-compact.js');
  const taoziHome = path.join(os.tmpdir(), `taozi-suggest-repeat-${Date.now()}`);
  const input = {
    tool_name: 'Edit',
    tool_input: { file_path: '/tmp/repeated.js' },
  };

  try {
    for (let i = 0; i < 15; i++) {
      const result = runHook(script, input, { env: { TAOZI_HOME: taoziHome } });
      assert.strictEqual(result.status, 0, 'Should exit(0)');
      assert(!result.stderr.includes('建议压缩上下文'), 'Should not warn for repeated edits to one file');
    }
  } finally {
    fs.rmSync(taoziHome, { recursive: true, force: true });
  }
});

test('suggest-compact 在 15 个唯一文件后提示压缩', () => {
  const script = path.join(HOOKS_DIR, 'suggest-compact.js');
  const taoziHome = path.join(os.tmpdir(), `taozi-suggest-unique-${Date.now()}`);

  try {
    for (let i = 0; i < 14; i++) {
      const result = runHook(script, {
        tool_name: 'Edit',
        tool_input: { file_path: `/tmp/file-${i}.js` },
      }, { env: { TAOZI_HOME: taoziHome } });
      assert.strictEqual(result.status, 0, 'Should exit(0)');
      assert(!result.stderr.includes('建议压缩上下文'), 'Should not warn before threshold');
    }

    const finalResult = runHook(script, {
      tool_name: 'Write',
      tool_input: { file_path: '/tmp/file-14.js' },
    }, { env: { TAOZI_HOME: taoziHome } });
    assert.strictEqual(finalResult.status, 0, 'Should exit(0)');
    assert(finalResult.stderr.includes('建议压缩上下文'), 'Should warn after 15 unique files');
  } finally {
    fs.rmSync(taoziHome, { recursive: true, force: true });
  }
});

test('security-scan 扫描未跟踪的 .env 文件', () => {
  const script = path.join(HOOKS_DIR, 'security-scan.js');
  const repoDir = path.join(os.tmpdir(), `taozi-security-scan-${Date.now()}`);

  try {
    initGitRepo(repoDir);
    fs.writeFileSync(path.join(repoDir, '.env'), 'OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456\n');

    const result = runHook(script, {}, { cwd: repoDir });
    assert.strictEqual(result.status, 0, 'Should exit(0)');
    assert(result.stderr.includes('.env 文件提交'), 'Should flag committed .env files');
    assert(result.stderr.includes('AI API Key'), 'Should scan untracked file contents');
  } finally {
    fs.rmSync(repoDir, { recursive: true, force: true });
  }
});

test('security-scan 为重复命中报告准确行号', () => {
  const script = path.join(HOOKS_DIR, 'security-scan.js');
  const repoDir = path.join(os.tmpdir(), `taozi-security-lines-${Date.now()}`);

  try {
    initGitRepo(repoDir);
    fs.writeFileSync(
      path.join(repoDir, 'app.js'),
      [
        'const a = "postgres://alice:secret@db/app";',
        'const b = "postgres://bob:secret@db/app";',
        '',
      ].join('\n')
    );

    const result = runHook(script, {}, { cwd: repoDir });
    assert.strictEqual(result.status, 0, 'Should exit(0)');
    assert(result.stderr.includes('L1 [数据库 URL 含凭据]'), 'Should report first line');
    assert(result.stderr.includes('L2 [数据库 URL 含凭据]'), 'Should report second line');
  } finally {
    fs.rmSync(repoDir, { recursive: true, force: true });
  }
});

// =====================
// 8. pre-compact
// =====================

test('pre-compact outputs context reminder', () => {
  const script = path.join(HOOKS_DIR, 'pre-compact.js');
  const result = runHook(script, {});
  assert.strictEqual(result.status, 0, 'Should exit(0)');
  assert(result.stderr.includes('Pre-Compact'), 'Should include pre-compact header');
  assert(result.stderr.includes('Active file paths'), 'Should mention active file paths');
});

// =====================
// 9. wechat-key-check
// =====================

test('wechat-key-check allows non-wechat commands', () => {
  const script = path.join(HOOKS_DIR, 'wechat-key-check.js');
  const result = runHook(script, {
    tool_input: { command: 'curl https://api.example.com/data' },
  });
  assert.strictEqual(result.status, 0, 'Should exit(0) for non-WeChat commands');
});

test('wechat-key-check allows when both credentials configured', () => {
  const script = path.join(HOOKS_DIR, 'wechat-key-check.js');
  const result = runHook(
    script,
    { tool_input: { command: 'curl https://api.weixin.qq.com/cgi-bin/stable_token' } },
    { env: { WECHAT_APPID: 'wx_test123', WECHAT_APPSECRET: 'secret_test456' } }
  );
  assert.strictEqual(result.status, 0, 'Should exit(0) when both env vars are set');
});

test('wechat-key-check blocks when WECHAT_APPID missing', () => {
  const script = path.join(HOOKS_DIR, 'wechat-key-check.js');
  const result = runHook(
    script,
    { tool_input: { command: 'curl https://api.weixin.qq.com/cgi-bin/stable_token' } },
    { env: { WECHAT_APPID: '', WECHAT_APPSECRET: 'secret_test456' } }
  );
  assert.strictEqual(result.status, 2, 'Should exit(2) when WECHAT_APPID is missing');
  assert(result.stderr.includes('WECHAT_APPID'), 'Should mention missing variable');
});

test('wechat-key-check blocks when WECHAT_APPSECRET missing', () => {
  const script = path.join(HOOKS_DIR, 'wechat-key-check.js');
  const result = runHook(
    script,
    { tool_input: { command: 'curl https://api.weixin.qq.com/cgi-bin/stable_token' } },
    { env: { WECHAT_APPID: 'wx_test123', WECHAT_APPSECRET: '' } }
  );
  assert.strictEqual(result.status, 2, 'Should exit(2) when WECHAT_APPSECRET is missing');
  assert(result.stderr.includes('WECHAT_APPSECRET'), 'Should mention missing variable');
});

test('wechat-key-check blocks when both credentials missing', () => {
  const script = path.join(HOOKS_DIR, 'wechat-key-check.js');
  const result = runHook(
    script,
    { tool_input: { command: 'python3 wechat_publish.py --url https://api.weixin.qq.com/draft/add' } },
    { env: { WECHAT_APPID: '', WECHAT_APPSECRET: '' } }
  );
  assert.strictEqual(result.status, 2, 'Should exit(2) when both env vars are missing');
  assert(result.stderr.includes('WECHAT_APPID'), 'Should list WECHAT_APPID in missing');
  assert(result.stderr.includes('WECHAT_APPSECRET'), 'Should list WECHAT_APPSECRET in missing');
});

test('wechat-key-check handles missing tool_input gracefully', () => {
  const script = path.join(HOOKS_DIR, 'wechat-key-check.js');
  const result = runHook(script, { some_other_key: true });
  assert.strictEqual(result.status, 0, 'Should exit(0) for missing tool_input');
});

test('wechat-key-check handles empty input gracefully', () => {
  const script = path.join(HOOKS_DIR, 'wechat-key-check.js');
  const result = runHook(script, {});
  assert.strictEqual(result.status, 0, 'Should exit(0) for empty input');
});

test('wechat-key-check blocks direct wechat_publish.py call without credentials', () => {
  const script = path.join(HOOKS_DIR, 'wechat-key-check.js');
  const result = runHook(
    script,
    { tool_input: { command: 'python3 wechat_publish.py --publish' } },
    { env: { WECHAT_APPID: '', WECHAT_APPSECRET: '' } }
  );
  assert.strictEqual(result.status, 2, 'Should exit(2) when calling wechat_publish.py without credentials');
});

test('wechat-key-check allows direct wechat_publish.py call with credentials', () => {
  const script = path.join(HOOKS_DIR, 'wechat-key-check.js');
  const result = runHook(
    script,
    { tool_input: { command: 'python3 wechat_publish.py --publish' } },
    { env: { WECHAT_APPID: 'wx_test123', WECHAT_APPSECRET: 'secret_test456' } }
  );
  assert.strictEqual(result.status, 0, 'Should exit(0) when calling wechat_publish.py with credentials');
});
