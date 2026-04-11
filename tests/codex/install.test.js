/**
 * Stable Codex install tests
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { installCodexPlugin, getInstallRoot } = require('../../scripts/lib/codex-installer');

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function makeFixtureRepo() {
  const root = makeTempDir('taozi-codex-install-repo-');
  writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'taozi-universal', version: '9.9.9' }));
  writeFile(path.join(root, '.agents', 'skills', 'taozi-router', 'SKILL.md'), '# router\n');
  writeFile(path.join(root, '.agents', 'skills', 'taozi-plan', 'SKILL.md'), '# plan\n');
  writeFile(path.join(root, '.codex', 'agents', 'chief-of-staff.toml'), 'name = "chief-of-staff"\n');
  writeFile(path.join(root, '.codex', 'agents', 'planner.toml'), 'name = "planner"\n');
  return root;
}

function cleanup(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

test('installCodexPlugin vendors generated artifacts into stable Codex paths', () => {
  const repoRoot = makeFixtureRepo();
  const codexHome = makeTempDir('taozi-codex-home-');

  try {
    const result = installCodexPlugin({ repoRoot, codexHome });
    const installRoot = getInstallRoot(codexHome);

    assert.strictEqual(result.skillCount, 2);
    assert.strictEqual(result.agentCount, 2);
    assert.ok(fs.existsSync(path.join(installRoot, 'skills', 'taozi-router', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(installRoot, 'agents', 'chief-of-staff.toml')));

    assert.strictEqual(
      fs.realpathSync(path.join(codexHome, 'skills', 'taozi-router')),
      fs.realpathSync(path.join(installRoot, 'skills', 'taozi-router'))
    );
    assert.strictEqual(
      fs.realpathSync(path.join(codexHome, 'agents', 'chief-of-staff.toml')),
      fs.realpathSync(path.join(installRoot, 'agents', 'chief-of-staff.toml'))
    );
  } finally {
    cleanup(repoRoot);
    cleanup(codexHome);
  }
});

test('installCodexPlugin migrates repo-linked global Taozi entries to stable install targets', () => {
  const repoRoot = makeFixtureRepo();
  const codexHome = makeTempDir('taozi-codex-home-');

  try {
    fs.mkdirSync(path.join(codexHome, 'skills'), { recursive: true });
    fs.mkdirSync(path.join(codexHome, 'agents'), { recursive: true });
    fs.symlinkSync(
      path.join(repoRoot, '.agents', 'skills', 'taozi-router'),
      path.join(codexHome, 'skills', 'taozi-router'),
      'dir'
    );
    fs.symlinkSync(
      path.join(repoRoot, '.codex', 'agents', 'chief-of-staff.toml'),
      path.join(codexHome, 'agents', 'chief-of-staff.toml'),
      'file'
    );

    installCodexPlugin({ repoRoot, codexHome });
    const installRoot = getInstallRoot(codexHome);

    assert.strictEqual(
      fs.realpathSync(path.join(codexHome, 'skills', 'taozi-router')),
      fs.realpathSync(path.join(installRoot, 'skills', 'taozi-router'))
    );
    assert.strictEqual(
      fs.realpathSync(path.join(codexHome, 'agents', 'chief-of-staff.toml')),
      fs.realpathSync(path.join(installRoot, 'agents', 'chief-of-staff.toml'))
    );
  } finally {
    cleanup(repoRoot);
    cleanup(codexHome);
  }
});

test('installCodexPlugin refuses to overwrite unmanaged Codex entries', () => {
  const repoRoot = makeFixtureRepo();
  const codexHome = makeTempDir('taozi-codex-home-');

  try {
    writeFile(path.join(codexHome, 'skills', 'taozi-router', 'SKILL.md'), '# unrelated\n');
    assert.throws(() => installCodexPlugin({ repoRoot, codexHome }), /refusing to overwrite unmanaged path/);
  } finally {
    cleanup(repoRoot);
    cleanup(codexHome);
  }
});

test('installCodexPlugin removes stale managed links from previous installs', () => {
  const repoRoot = makeFixtureRepo();
  const codexHome = makeTempDir('taozi-codex-home-');

  try {
    installCodexPlugin({ repoRoot, codexHome });

    fs.rmSync(path.join(repoRoot, '.agents', 'skills', 'taozi-plan'), { recursive: true, force: true });
    fs.rmSync(path.join(repoRoot, '.codex', 'agents', 'planner.toml'), { force: true });

    installCodexPlugin({ repoRoot, codexHome });

    assert.ok(!fs.existsSync(path.join(codexHome, 'skills', 'taozi-plan')));
    assert.ok(!fs.existsSync(path.join(codexHome, 'agents', 'planner.toml')));
  } finally {
    cleanup(repoRoot);
    cleanup(codexHome);
  }
});
