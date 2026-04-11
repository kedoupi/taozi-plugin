/**
 * Codex support surface tests
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const SOURCE_AGENTS_DIR = path.join(ROOT, 'agents');
const SOURCE_SKILLS_DIR = path.join(ROOT, 'skills');
const CODEX_CONFIG = path.join(ROOT, '.codex', 'config.toml');
const CODEX_HOOKS = path.join(ROOT, '.codex', 'hooks.json');
const CODEX_PLUGIN = path.join(ROOT, '.codex-plugin', 'plugin.json');
const CODEX_AGENTS_DIR = path.join(ROOT, '.codex', 'agents');
const CODEX_SKILLS_DIR = path.join(ROOT, '.agents', 'skills');
const CODEX_MARKETPLACE = path.join(ROOT, '.agents', 'plugins', 'marketplace.json');
const CODEX_AGENTS_MANIFEST = path.join(ROOT, '.codex', '.taozi-sync-agents.json');
const CODEX_SKILLS_MANIFEST = path.join(ROOT, '.agents', '.taozi-sync-skills.json');
const SYNC_SCRIPT = path.join(ROOT, 'scripts', 'sync-codex.js');

function makeFixtureRoot() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'taozi-codex-test-'));
  for (const relativePath of ['agents', 'skills', 'scripts']) {
    fs.cpSync(path.join(ROOT, relativePath), path.join(fixtureRoot, relativePath), {
      recursive: true,
    });
  }
  return fixtureRoot;
}

function withFixture(callback) {
  const fixtureRoot = makeFixtureRoot();
  try {
    callback(fixtureRoot);
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function listDirs(dirPath) {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
}

function listFiles(dirPath, suffix) {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith(suffix))
    .map(entry => entry.name)
    .sort();
}

function runSync(cwd = ROOT) {
  const syncScript = path.join(cwd, 'scripts', 'sync-codex.js');
  const result = spawnSync('node', [syncScript], {
    cwd,
    encoding: 'utf8',
    timeout: 10000,
  });
  assert.strictEqual(result.status, 0, result.stderr || result.stdout || 'sync-codex failed');
}

function runTomlValidation() {
  const script = `
import pathlib, sys
try:
    import tomllib as toml_parser
except ModuleNotFoundError:
    try:
        import tomli as toml_parser
    except ModuleNotFoundError:
        print("skip")
        raise SystemExit(0)

root = pathlib.Path(${JSON.stringify(ROOT)})
paths = [root / '.codex' / 'config.toml', *sorted((root / '.codex' / 'agents').glob('*.toml'))]
for path in paths:
    with path.open('rb') as f:
        toml_parser.load(f)
print("ok")
`;

  const result = spawnSync('python3', ['-c', script], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 10000,
  });

  assert.strictEqual(result.status, 0, result.stderr || result.stdout || 'TOML validation failed');
}

function runCodexHookCommand(command, options = {}) {
  const shell = fs.existsSync('/bin/zsh') ? '/bin/zsh' : '/bin/bash';
  return spawnSync(shell, ['-lc', command], {
    cwd: options.cwd || ROOT,
    encoding: 'utf8',
    timeout: 10000,
    env: {
      ...process.env,
      ...(options.env || {}),
    },
    input: JSON.stringify(options.stdin || {}),
  });
}

test('Codex config exists and enables hooks', () => {
  const content = fs.readFileSync(CODEX_CONFIG, 'utf8');
  assert(content.includes('[features]'), 'missing [features] table');
  assert(content.includes('codex_hooks = true'), 'Codex hooks not enabled');
});

test('Codex hooks config is valid JSON', () => {
  const parsed = JSON.parse(fs.readFileSync(CODEX_HOOKS, 'utf8'));
  assert(parsed.hooks.PreToolUse, 'missing PreToolUse hooks');
});

test('Codex hook commands resolve Taozi hook scripts outside the current repo', () => {
  const parsed = JSON.parse(fs.readFileSync(CODEX_HOOKS, 'utf8'));
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'taozi-codex-hook-repo-'));

  try {
    const init = spawnSync('git', ['init'], {
      cwd: repoRoot,
      encoding: 'utf8',
      timeout: 10000,
    });
    assert.strictEqual(init.status, 0, init.stderr || init.stdout || 'git init failed');

    for (const hookGroup of parsed.hooks.PreToolUse) {
      for (const hook of hookGroup.hooks) {
        const result = runCodexHookCommand(hook.command, {
          cwd: repoRoot,
          env: { CODEX_PLUGIN_ROOT: ROOT },
          stdin: {},
        });
        assert.strictEqual(result.status, 0, result.stderr || result.stdout || `hook command failed: ${hook.command}`);
      }
    }
  } finally {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  }
});

test('Codex plugin manifest is valid and points at shared skills', () => {
  const manifest = JSON.parse(fs.readFileSync(CODEX_PLUGIN, 'utf8'));
  assert.strictEqual(manifest.name, 'taozi');
  assert.strictEqual(manifest.skills, './skills/');
});

test('Codex marketplace is valid local plugin config', () => {
  const marketplace = JSON.parse(fs.readFileSync(CODEX_MARKETPLACE, 'utf8'));
  assert.strictEqual(marketplace.plugins[0].source.source, 'local');
  assert.strictEqual(marketplace.plugins[0].source.path, './');
});

test('Codex sync manifests exist', () => {
  assert(fs.existsSync(CODEX_AGENTS_MANIFEST), 'missing agent sync manifest');
  assert(fs.existsSync(CODEX_SKILLS_MANIFEST), 'missing skill sync manifest');
});

test('Codex agent count matches canonical agents', () => {
  const sourceAgents = listFiles(SOURCE_AGENTS_DIR, '.md');
  const codexAgents = listFiles(CODEX_AGENTS_DIR, '.toml');
  assert.strictEqual(codexAgents.length, sourceAgents.length);
});

test('every canonical agent has a generated Codex agent file', () => {
  const sourceAgents = listFiles(SOURCE_AGENTS_DIR, '.md');
  for (const agentFile of sourceAgents) {
    const tomlPath = path.join(CODEX_AGENTS_DIR, agentFile.replace(/\.md$/, '.toml'));
    assert(fs.existsSync(tomlPath), `missing generated agent: ${tomlPath}`);

    const content = fs.readFileSync(tomlPath, 'utf8');
    assert(content.includes('developer_instructions = """'), `missing developer_instructions in ${tomlPath}`);
  }
});

test('Codex skill directories mirror canonical skills', () => {
  withFixture(fixtureRoot => {
    runSync(fixtureRoot);

    const sourceSkills = listDirs(path.join(fixtureRoot, 'skills'));
    const codexSkills = listDirs(path.join(fixtureRoot, '.agents', 'skills'));
    assert.deepStrictEqual(codexSkills, sourceSkills);
  });
});

test('mirrored Codex skills keep SKILL.md content in sync', () => {
  withFixture(fixtureRoot => {
    runSync(fixtureRoot);

    const sourceSkills = listDirs(path.join(fixtureRoot, 'skills'));
    for (const skillName of sourceSkills) {
      const sourceFile = path.join(fixtureRoot, 'skills', skillName, 'SKILL.md');
      const targetFile = path.join(fixtureRoot, '.agents', 'skills', skillName, 'SKILL.md');
      assert(fs.existsSync(targetFile), `missing mirrored skill file: ${targetFile}`);
      assert.strictEqual(fs.readFileSync(targetFile, 'utf8'), fs.readFileSync(sourceFile, 'utf8'));
    }
  });
});

test('sync-codex preserves hand-written Codex-only files', () => {
  withFixture(fixtureRoot => {
    runSync(fixtureRoot);

    const manualAgent = path.join(fixtureRoot, '.codex', 'agents', 'manual-preserved.toml');
    const manualSkillDir = path.join(fixtureRoot, '.agents', 'skills', 'manual-preserved');
    const manualSkillFile = path.join(manualSkillDir, 'SKILL.md');

    fs.writeFileSync(manualAgent, 'name = "manual-preserved"\n');
    fs.mkdirSync(manualSkillDir, { recursive: true });
    fs.writeFileSync(manualSkillFile, '# manual\n');

    runSync(fixtureRoot);
    assert(fs.existsSync(manualAgent), 'manual Codex agent should survive sync');
    assert(fs.existsSync(manualSkillFile), 'manual Codex skill should survive sync');
  });
});

test('sync-codex refuses to delete paths outside repo root from manifest', () => {
  withFixture(fixtureRoot => {
    const manifestPath = path.join(fixtureRoot, '.codex', '.taozi-sync-agents.json');
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({ entries: ['../../outside-repo'] }, null, 2),
      'utf8'
    );

    const result = spawnSync('node', [path.join(fixtureRoot, 'scripts', 'sync-codex.js')], {
      cwd: fixtureRoot,
      encoding: 'utf8',
      timeout: 10000,
    });

    assert.notStrictEqual(result.status, 0, 'sync should fail on unsafe manifest entries');
    assert(
      (result.stderr || result.stdout).includes('outside repo root'),
      'missing safety error for unsafe manifest entry'
    );
  });
});

test('generated Codex TOML files parse successfully', () => {
  runTomlValidation();
});
