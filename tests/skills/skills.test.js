const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('../../scripts/lib/utils');

const skillsDir = path.join(__dirname, '..', '..', 'skills');
const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

const requiredFields = ['name', 'description'];

for (const dir of skillDirs) {
  const skillPath = path.join(skillsDir, dir, 'SKILL.md');

  test(`Skill ${dir}: 存在 SKILL.md`, () => {
    assert.ok(fs.existsSync(skillPath), `缺少 SKILL.md 文件`);
  });

  if (fs.existsSync(skillPath)) {
    const content = fs.readFileSync(skillPath, 'utf8');
    const fm = parseFrontmatter(content);

    test(`Skill ${dir}: SKILL.md 有 frontmatter`, () => {
      assert.ok(fm !== null, `SKILL.md 缺少 YAML frontmatter`);
    });

    if (fm) {
      for (const field of requiredFields) {
        test(`Skill ${dir}: 有 ${field} 字段`, () => {
          assert.ok(fm[field], `缺少必填字段: ${field}`);
        });
      }
    }

    test(`Skill ${dir}: 正文内容非空`, () => {
      const bodyContent = content.replace(/^---[\s\S]*?---/, '').trim();
      assert.ok(bodyContent.length > 20, `正文内容过短 (${bodyContent.length} chars)`);
    });
  }
}

// Check for unique names
test('所有 skill name 唯一', () => {
  const names = skillDirs.map(dir => {
    const skillPath = path.join(skillsDir, dir, 'SKILL.md');
    if (!fs.existsSync(skillPath)) return null;
    const c = fs.readFileSync(skillPath, 'utf8');
    const fm = parseFrontmatter(c);
    return fm?.name;
  }).filter(Boolean);
  const uniqueNames = new Set(names);
  assert.strictEqual(uniqueNames.size, names.length, `存在重复的 skill name`);
});
