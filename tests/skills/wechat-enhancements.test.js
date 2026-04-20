const fs = require('fs');
const path = require('path');

const ENHANCEMENTS_PATH = path.join(__dirname, '..', '..', 'skills', 'wechat', 'references', 'enhancements.md');
const content = fs.existsSync(ENHANCEMENTS_PATH) ? fs.readFileSync(ENHANCEMENTS_PATH, 'utf8') : '';

test('enhancements.md 文件存在', () => {
  assert.ok(fs.existsSync(ENHANCEMENTS_PATH), 'enhancements.md 不存在');
});

test('enhancements.md 含 4 类增强策略', () => {
  ['角度发现', '密度强化', '细节锚定', '真实体感'].forEach(name => {
    assert.ok(content.includes(`## ${name}`), `缺少策略: ${name}`);
  });
});

test('每个策略含"做什么"+"触发示例"+"注入指令模板"三节', () => {
  ['角度发现', '密度强化', '细节锚定', '真实体感'].forEach(name => {
    const idx = content.indexOf(`## ${name}`);
    const nextH2 = content.indexOf('\n## ', idx + 1);
    const section = content.slice(idx, nextH2 > 0 ? nextH2 : content.length);
    assert.ok(section.includes('### 做什么'),       `${name} 缺少"做什么"`);
    assert.ok(section.includes('### 触发示例'),     `${name} 缺少"触发示例"`);
    assert.ok(section.includes('### 注入指令模板'), `${name} 缺少"注入指令模板"`);
  });
});

test('映射表 7 行覆盖全部框架', () => {
  ['痛点型', '故事型', '清单型', '对比型', '热点解读型', '纯观点型', '复盘型'].forEach(fw => {
    assert.ok(content.includes(`| ${fw} `), `映射表缺少框架: ${fw}`);
  });
});

test('热点解读型和纯观点型必启用角度发现', () => {
  const lines = content.split('\n');
  const hotline = lines.find(l => l.startsWith('| 热点解读型'));
  const opinionline = lines.find(l => l.startsWith('| 纯观点型'));
  assert.ok(hotline && hotline.includes('角度发现'), '热点解读型应必启用角度发现');
  assert.ok(opinionline && opinionline.includes('角度发现'), '纯观点型应必启用角度发现');
});

test('含输出元信息格式说明（<!-- 框架: ... | 增强: ... -->）', () => {
  assert.ok(/<!-- 框架:.*增强:/.test(content), '缺少草稿元信息格式说明');
});

test('映射表中痛点型和对比型必启用密度强化，故事型必启用真实体感', () => {
  const lines = content.split('\n');
  const painline = lines.find(l => l.startsWith('| 痛点型'));
  const cmpline  = lines.find(l => l.startsWith('| 对比型'));
  const storyline = lines.find(l => l.startsWith('| 故事型'));
  assert.ok(painline && painline.includes('密度强化'), '痛点型应必启用密度强化');
  assert.ok(cmpline && cmpline.includes('密度强化'), '对比型应必启用密度强化');
  assert.ok(storyline && storyline.includes('真实体感'), '故事型应必启用真实体感');
});
