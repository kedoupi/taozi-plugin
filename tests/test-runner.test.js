const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

test('run-all exits non-zero when a test file fails to load', () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'taozi-runner-test-'));

  try {
    const fixtureTestsDir = path.join(fixtureRoot, 'tests');
    fs.mkdirSync(fixtureTestsDir, { recursive: true });
    fs.copyFileSync(path.join(__dirname, 'run-all.js'), path.join(fixtureTestsDir, 'run-all.js'));

    fs.writeFileSync(
      path.join(fixtureTestsDir, 'passing.test.js'),
      'test("fixture passes", () => { assert.ok(true); });\n',
      'utf8'
    );
    fs.writeFileSync(
      path.join(fixtureTestsDir, 'broken.test.js'),
      'throw new Error("broken during require");\n',
      'utf8'
    );

    const result = spawnSync('node', [path.join(fixtureTestsDir, 'run-all.js')], {
      cwd: fixtureRoot,
      encoding: 'utf8',
      timeout: 10000,
    });

    assert.strictEqual(result.status, 1, result.stderr || result.stdout || 'runner should fail');
    assert(result.stdout.includes('测试文件加载失败: broken during require'), 'missing load failure output');
    assert(result.stdout.includes('✗ 失败: 1'), 'missing failure count');
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});
