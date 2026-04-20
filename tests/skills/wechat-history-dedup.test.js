const fs = require('fs');
const path = require('path');

const SKILL_PATH = path.join(__dirname, '..', '..', 'skills', 'wechat', 'SKILL.md');
const skillContent = fs.existsSync(SKILL_PATH) ? fs.readFileSync(SKILL_PATH, 'utf8') : '';

test('Sub-Agent A 含读取 history.yaml 指令', () => {
  assert.ok(/读取.*history\.yaml|history\.yaml.*读取|Read.*history\.yaml/.test(skillContent),
    'Sub-Agent A 缺少读取 history.yaml 的指令');
});

test('Sub-Agent A 含去重逻辑（相似度阈值或 dedup 描述）', () => {
  assert.ok(/相似度.*70|去重|dedup/.test(skillContent), '缺少去重逻辑描述');
});

test('Sub-Agent A 含 3 路 YouMind 调研（行业热点/破圈话题/竞品对标）', () => {
  assert.ok(skillContent.includes('行业热点'), '缺少"行业热点"路');
  assert.ok(skillContent.includes('破圈话题'), '缺少"破圈话题"路');
  assert.ok(skillContent.includes('竞品对标'), '缺少"竞品对标"路');
});

test('Sub-Agent A 含 3 维打分（热度/相关性/SEO，权重 0.4/0.4/0.2）', () => {
  assert.ok(/热度.*0\.4|权重 0\.4.*热度/.test(skillContent), '缺少热度维度（权重 0.4）');
  assert.ok(/相关性.*0\.4|权重 0\.4.*相关性/.test(skillContent), '缺少相关性维度（权重 0.4）');
  assert.ok(/SEO.*0\.2|权重 0\.2.*SEO/.test(skillContent), '缺少 SEO 维度（权重 0.2）');
});

test('Sub-Agent A 输出 1 推荐 + 3 备选', () => {
  assert.ok(/RECOMMENDED/.test(skillContent), '缺少 RECOMMENDED 输出标识');
  assert.ok(/ALTERNATIVES/.test(skillContent), '缺少 ALTERNATIVES 输出标识');
});

test('Sub-Agent A 含 3 路失败处理', () => {
  assert.ok(/任一失败|某路失败|3 路.*失败|路.*失败/.test(skillContent),
    '缺少 3 路调研失败处理逻辑');
});
