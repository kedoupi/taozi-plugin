const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('../../scripts/lib/utils');

const agentsDir = path.join(__dirname, '..', '..', 'agents');
const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));

// Required fields for every agent
const requiredFields = ['name', 'description', 'tools', 'model'];
const validModels = ['opus', 'sonnet', 'haiku'];

for (const file of agentFiles) {
  const content = fs.readFileSync(path.join(agentsDir, file), 'utf8');
  const fm = parseFrontmatter(content);

  test(`Agent ${file}: 有有效 frontmatter`, () => {
    assert.ok(fm !== null, `缺少 YAML frontmatter`);
  });

  if (fm) {
    for (const field of requiredFields) {
      test(`Agent ${file}: 有 ${field} 字段`, () => {
        assert.ok(fm[field], `缺少必填字段: ${field}`);
      });
    }

    test(`Agent ${file}: model 值合法`, () => {
      assert.ok(validModels.includes(fm.model), `无效 model: ${fm.model}，应为 opus/sonnet/haiku`);
    });

    test(`Agent ${file}: tools 非空`, () => {
      assert.ok(fm.tools && fm.tools.length > 0, `tools 字段为空`);
    });

    test(`Agent ${file}: 正文内容非空`, () => {
      const bodyContent = content.replace(/^---[\s\S]*?---/, '').trim();
      assert.ok(bodyContent.length > 50, `正文内容过短 (${bodyContent.length} chars)`);
    });
  }
}

// Check for unique names
test('所有 agent name 唯一', () => {
  const names = agentFiles.map(f => {
    const c = fs.readFileSync(path.join(agentsDir, f), 'utf8');
    const fm = parseFrontmatter(c);
    return fm?.name;
  }).filter(Boolean);
  const uniqueNames = new Set(names);
  assert.strictEqual(uniqueNames.size, names.length, `存在重复的 agent name: ${names.filter((n, i) => names.indexOf(n) !== i)}`);
});
