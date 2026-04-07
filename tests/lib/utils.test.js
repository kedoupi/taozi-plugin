/**
 * Taozi Plugin - scripts/lib/utils.js 单元测试
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  ensureDir,
  readFile,
  writeFile,
  readJson,
  writeJson,
  findFiles,
  getDateString,
  getDateTimeString,
  parseFrontmatter,
  getPluginRoot,
} = require('../../scripts/lib/utils');

// --- 临时目录辅助 ---

const tmpBase = path.join(os.tmpdir(), 'taozi-test-' + process.pid);

function setup() {
  ensureDir(tmpBase);
}

function cleanup() {
  try {
    fs.rmSync(tmpBase, { recursive: true, force: true });
  } catch {}
}

// --- 测试 ---

setup();

test('ensureDir 创建嵌套目录', () => {
  const nested = path.join(tmpBase, 'a', 'b', 'c');
  ensureDir(nested);
  assert.ok(fs.existsSync(nested));
});

test('writeFile + readFile 正常工作', () => {
  const filePath = path.join(tmpBase, 'test.txt');
  writeFile(filePath, 'hello taozi');
  assert.strictEqual(readFile(filePath), 'hello taozi');
});

test('readFile 文件不存在返回 null', () => {
  const result = readFile(path.join(tmpBase, 'nonexistent.txt'));
  assert.strictEqual(result, null);
});

test('writeJson + readJson 正常工作', () => {
  const filePath = path.join(tmpBase, 'test.json');
  const data = { name: 'taozi', version: '3.0.0' };
  writeJson(filePath, data);
  const result = readJson(filePath);
  assert.strictEqual(result.name, 'taozi');
  assert.strictEqual(result.version, '3.0.0');
});

test('readJson 无效 JSON 返回 null', () => {
  const filePath = path.join(tmpBase, 'bad.json');
  fs.writeFileSync(filePath, '{invalid json}');
  const result = readJson(filePath);
  assert.strictEqual(result, null);
});

test('findFiles 按模式搜索文件', () => {
  writeFile(path.join(tmpBase, 'a.js'), '');
  writeFile(path.join(tmpBase, 'b.ts'), '');
  writeFile(path.join(tmpBase, 'c.txt'), '');

  const jsFiles = findFiles(tmpBase, '\\.js$');
  assert.ok(jsFiles.some(f => f.endsWith('a.js')));
  assert.ok(!jsFiles.some(f => f.endsWith('c.txt')));
});

test('getDateString 返回 YYYY-MM-DD 格式', () => {
  const date = getDateString();
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(date));
});

test('getDateTimeString 返回合法路径格式', () => {
  const dt = getDateTimeString();
  assert.ok(!dt.includes(':'));
  assert.ok(!dt.includes('.'));
});

test('parseFrontmatter 正确解析 YAML 前置数据', () => {
  const content = '---\nname: test-agent\ndescription: 测试\nmodel: opus\n---\n\n正文内容';
  const fm = parseFrontmatter(content);
  assert.strictEqual(fm.name, 'test-agent');
  assert.strictEqual(fm.description, '测试');
  assert.strictEqual(fm.model, 'opus');
});

test('parseFrontmatter 无前置数据返回 null', () => {
  const content = '# 没有前置数据的文件\n\n正文';
  const fm = parseFrontmatter(content);
  assert.strictEqual(fm, null);
});

test('getPluginRoot 返回有效路径或 null', () => {
  const root = getPluginRoot();
  // 不一定总能找到，但不应抛异常
  assert.ok(root === null || typeof root === 'string');
});

// --- 清理 ---

cleanup();
