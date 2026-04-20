const fs = require('fs');
const path = require('path');

const ENH_PATH = path.join(__dirname, '..', '..', 'skills', 'wechat', 'references', 'enhancements.md');
const content = fs.existsSync(ENH_PATH) ? fs.readFileSync(ENH_PATH, 'utf8') : '';

test('enhancements.md 文件存在', () => {
  assert.ok(fs.existsSync(ENH_PATH), 'enhancements.md 不存在');
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
