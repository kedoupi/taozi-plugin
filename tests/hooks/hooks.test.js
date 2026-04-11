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
    status: result.status || 0,
  };
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
