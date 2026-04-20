const fs = require('fs');
const path = require('path');

const SKILL_PATH = path.join(__dirname, '..', '..', 'skills', 'wechat', 'SKILL.md');
const fullContent = fs.existsSync(SKILL_PATH) ? fs.readFileSync(SKILL_PATH, 'utf8') : '';

// 只截取 Sub-Agent A 段（从"子 Agent A"标题起到下一个"子 Agent"标题前）
function extractSubAgentA(content) {
  const start = content.indexOf('**子 Agent A');
  if (start < 0) return '';
  const afterA = content.indexOf('**子 Agent B', start + 1);
  return content.slice(start, afterA > 0 ? afterA : content.length);
}
const subAgentA = extractSubAgentA(fullContent);

test('Sub-Agent A 含读取 history.yaml 指令', () => {
  assert.ok(/读取.*history\.yaml|history\.yaml.*读取|Read.*history\.yaml/.test(subAgentA),
    'Sub-Agent A 缺少读取 history.yaml 的指令');
});

test('Sub-Agent A 含 published_at 过滤说明', () => {
  assert.ok(/published_at/.test(subAgentA), 'Sub-Agent A 步骤 2 缺少 published_at 过滤');
});

test('Sub-Agent A 含去重逻辑描述', () => {
  assert.ok(/核心词|核心主题|去重|dedup/.test(subAgentA), '缺少去重逻辑描述');
});

test('Sub-Agent A 含 3 路 YouMind 调研（行业热点/破圈话题/竞品对标）', () => {
  assert.ok(subAgentA.includes('行业热点'), '缺少"行业热点"路');
  assert.ok(subAgentA.includes('破圈话题'), '缺少"破圈话题"路');
  assert.ok(subAgentA.includes('竞品对标'), '缺少"竞品对标"路');
});

test('Sub-Agent A 含 3 维打分（热度 0.4 / 相关性 0.4 / SEO 0.2）', () => {
  assert.ok(/热度.*0\.4|权重 0\.4.*热度/.test(subAgentA), '缺少热度维度（权重 0.4）');
  assert.ok(/相关性.*0\.4|权重 0\.4.*相关性/.test(subAgentA), '缺少相关性维度（权重 0.4）');
  assert.ok(/SEO.*0\.2|权重 0\.2.*SEO/.test(subAgentA), '缺少 SEO 维度（权重 0.2）');
});

test('Sub-Agent A 输出 1 推荐 + 3 备选 + DATA_NOTE', () => {
  assert.ok(/RECOMMENDED/.test(subAgentA), '缺少 RECOMMENDED 输出标识');
  assert.ok(/ALTERNATIVES/.test(subAgentA), '缺少 ALTERNATIVES 输出标识');
  assert.ok(/DATA_NOTE/.test(subAgentA), '缺少 DATA_NOTE 输出标识');
});

test('Sub-Agent A 含 3 路失败分级处理（任一失败 + 全失败）', () => {
  assert.ok(/任一失败|某路失败/.test(subAgentA), '缺少"任一失败"分支');
  assert.ok(/全失败|全部失败|3 路全/.test(subAgentA), '缺少"全失败"分支');
});

// ============ Task 4: Sub-Agent B 框架选择 + 增强注入测试 ============

function extractSubAgentB(content) {
  const start = content.indexOf('**子 Agent B');
  if (start < 0) return '';
  const afterB = content.indexOf('**子 Agent C', start + 1);
  return content.slice(start, afterB > 0 ? afterB : content.length);
}
const subAgentB = extractSubAgentB(fullContent);

test('Sub-Agent B 含框架选择步骤（Read frameworks.md）', () => {
  assert.ok(/frameworks\.md/.test(subAgentB), 'Sub-Agent B 缺少 frameworks.md 引用');
  assert.ok(/SELECTED_FRAMEWORK/.test(subAgentB), '缺少 SELECTED_FRAMEWORK 输出标识');
});

test('Sub-Agent B 含增强策略注入步骤（Read enhancements.md）', () => {
  assert.ok(/enhancements\.md/.test(subAgentB), 'Sub-Agent B 缺少 enhancements.md 引用');
  assert.ok(/必启用|启用增强|注入指令/.test(subAgentB), '缺少增强启用描述');
});

test('Sub-Agent B 草稿元信息格式含框架名 + 增强项', () => {
  assert.ok(/<!-- 框架:.*增强:/.test(subAgentB), '缺少草稿元信息格式说明');
});
