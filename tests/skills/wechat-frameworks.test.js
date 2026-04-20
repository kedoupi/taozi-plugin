const fs = require('fs');
const path = require('path');

const FRAMEWORKS_PATH = path.join(__dirname, '..', '..', 'skills', 'wechat', 'references', 'frameworks.md');

test('frameworks.md 文件存在', () => {
  assert.ok(fs.existsSync(FRAMEWORKS_PATH), 'frameworks.md 不存在');
});

test('frameworks.md 含 7 个框架小节', () => {
  const content = fs.readFileSync(FRAMEWORKS_PATH, 'utf8');
  const required = ['痛点型', '故事型', '清单型', '对比型', '热点解读型', '纯观点型', '复盘型'];
  required.forEach(name => {
    assert.ok(content.includes(`## ${name}`), `缺少框架: ${name}`);
  });
});

test('每个框架含"段落骨架"段', () => {
  const content = fs.readFileSync(FRAMEWORKS_PATH, 'utf8');
  const sections = content.split(/^## /m).slice(1);
  // 注意：含"框架选择判断顺序"段，所以总共 8 个 ## 段，框架占 7 个
  const frameworkSections = sections.filter(s => !s.startsWith('框架选择判断顺序'));
  assert.strictEqual(frameworkSections.length, 7, '框架数量应为 7');
  frameworkSections.forEach(sec => {
    const name = sec.split('\n')[0];
    assert.ok(sec.includes('### 段落骨架'), `${name} 缺少"段落骨架"小节`);
  });
});

test('frameworks.md 含框架选择判断顺序段', () => {
  const content = fs.readFileSync(FRAMEWORKS_PATH, 'utf8');
  assert.ok(content.includes('## 框架选择判断顺序'), '缺少"框架选择判断顺序"段');
});
