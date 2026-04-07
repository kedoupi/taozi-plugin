/**
 * Taozi Plugin - Rules 文件验证测试
 *
 * 验证所有规则文件：
 * - 文件存在且非空
 * - 有标题 (# Title)
 * - 至少有一个章节 (## Section)
 * - 不为空或占位符
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const rulesDir = path.join(__dirname, '..', '..', 'rules');

const EXPECTED_RULES = [
  'iron-rules.md',
  'coding-style.md',
  'git-workflow.md',
  'testing.md',
  'security.md',
  'performance.md',
];

function readRuleFile(filename) {
  const filePath = path.join(rulesDir, filename);
  assert.ok(fs.existsSync(filePath), `规则文件不存在: ${filename}`);
  const content = fs.readFileSync(filePath, 'utf-8');
  assert.ok(content.trim().length > 0, `规则文件为空: ${filename}`);
  return content;
}

function hasHeading(content) {
  return /^#\s+.+/m.test(content);
}

function hasSections(content) {
  return /^##\s+.+/m.test(content);
}

function isPlaceholder(content) {
  const placeholderPatterns = [
    /TODO/i,
    /待填写/,
    /placeholder/i,
    /TBD/i,
  ];
  const lines = content.trim().split('\n').filter(l => l.trim().length > 0);
  return lines.length < 5 || placeholderPatterns.some(p => p.test(content));
}

// --- 测试 ---

test('rules 目录存在', () => {
  assert.ok(fs.existsSync(rulesDir), 'rules/ 目录不存在');
  assert.ok(fs.statSync(rulesDir).isDirectory(), 'rules/ 不是目录');
});

test('规则文件数量正确', () => {
  const files = fs.readdirSync(rulesDir).filter(f => f.endsWith('.md'));
  assert.strictEqual(files.length, EXPECTED_RULES.length,
    `期望 ${EXPECTED_RULES.length} 个规则文件，实际 ${files.length} 个`);
});

for (const filename of EXPECTED_RULES) {
  test(`${filename} - 文件存在且非空`, () => {
    readRuleFile(filename);
  });

  test(`${filename} - 包含标题 (# )`, () => {
    const content = readRuleFile(filename);
    assert.ok(hasHeading(content), `${filename} 缺少标题 (# Title)`);
  });

  test(`${filename} - 包含至少一个章节 (## )`, () => {
    const content = readRuleFile(filename);
    assert.ok(hasSections(content), `${filename} 缺少章节 (## Section)`);
  });

  test(`${filename} - 不是占位符`, () => {
    const content = readRuleFile(filename);
    assert.ok(!isPlaceholder(content), `${filename} 看起来是占位符内容`);
  });
}
