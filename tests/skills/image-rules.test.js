#!/usr/bin/env node
/**
 * image-rules.test.js — Layer 1: 规则回归测试
 *
 * 验证 skills/image、wechat、xiaohongshu 以及 infographic references
 * 中的关键规则文本是否存在。纯文本断言，不调用任何 API。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

function readSkill(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

// --- 读取目标文件 ---
const imageSkill     = readSkill('skills/image/SKILL.md');
const wechatSkill    = readSkill('skills/wechat/SKILL.md');
const xhsSkill       = readSkill('skills/xiaohongshu/SKILL.md');
const layouts        = readSkill('skills/infographic/references/layouts.md');
const styles         = readSkill('skills/infographic/references/styles.md');
const setupSkill     = readSkill('skills/setup/SKILL.md');

// ======================================================
// 角色注入规则组
// ======================================================

test('规则1: cover + character 存在 → 必须注入角色锚点', () => {
  assert(
    imageSkill.includes('必须') && imageSkill.includes('角色锚点'),
    'image/SKILL.md 应同时包含"必须"和"角色锚点"'
  );
});

test('规则2: body + infographic → 不加角色', () => {
  assert(
    imageSkill.includes('infographic') && imageSkill.includes('不加角色'),
    'image/SKILL.md 应同时包含"infographic"和"不加角色"'
  );
});

test('规则3: body + illustration + character 存在 → 注入角色锚点', () => {
  assert(
    imageSkill.includes('illustration') && imageSkill.includes('注入角色锚点'),
    'image/SKILL.md 应同时包含"illustration"和"注入角色锚点"'
  );
});

// ======================================================
// 平台尺寸规则组
// ======================================================

test('规则4: wechat 封面 → 16:9', () => {
  // 必须在 wechat 封面行附近有 16:9
  const hasWechatCover = imageSkill.includes('wechat 封面');
  const has169 = imageSkill.includes('16:9');
  assert(hasWechatCover && has169, 'image/SKILL.md 应包含"wechat 封面"和"16:9"');
});

test('规则5: xiaohongshu 封面 → 3:4', () => {
  assert(
    imageSkill.includes('xiaohongshu 封面') && imageSkill.includes('3:4'),
    'image/SKILL.md 应包含"xiaohongshu 封面"和"3:4"'
  );
});

test('规则6: xiaohongshu 正文 → 1:1', () => {
  assert(
    imageSkill.includes('xiaohongshu 正文') && imageSkill.includes('1:1'),
    'image/SKILL.md 应包含"xiaohongshu 正文"和"1:1"'
  );
});

// ======================================================
// compatible_styles 默认值一致性
// ======================================================

const DEFAULT_STYLES = '[warm, vector-illustration, flat design]';

test('规则7: image/SKILL.md 包含 compatible_styles 默认值', () => {
  assert(
    imageSkill.includes(DEFAULT_STYLES),
    `image/SKILL.md 应包含默认值字符串: ${DEFAULT_STYLES}`
  );
});

test('规则8: wechat/SKILL.md 包含 compatible_styles 默认值', () => {
  assert(
    wechatSkill.includes(DEFAULT_STYLES),
    `wechat/SKILL.md 应包含默认值字符串: ${DEFAULT_STYLES}`
  );
});

test('规则9: xiaohongshu/SKILL.md 包含 compatible_styles 默认值', () => {
  assert(
    xhsSkill.includes(DEFAULT_STYLES),
    `xiaohongshu/SKILL.md 应包含默认值字符串: ${DEFAULT_STYLES}`
  );
});

// ======================================================
// Style Anchor 规则组（xiaohongshu/SKILL.md）
// ======================================================

test('规则10: xiaohongshu illustration 类型注入 Style Anchor', () => {
  assert(
    xhsSkill.includes('Style Anchor') && xhsSkill.includes('illustration'),
    'xiaohongshu/SKILL.md 应同时包含"Style Anchor"和"illustration"'
  );
});

// ======================================================
// wechat infographic 不注入角色
// ======================================================

test('规则12: wechat/SKILL.md infographic 不注入角色', () => {
  assert(
    wechatSkill.includes('infographic') && wechatSkill.includes('不注入角色'),
    'wechat/SKILL.md 应同时包含"infographic"和"不注入角色"'
  );
});

// ======================================================
// layouts.md 多方对比行
// ======================================================

test('规则14: layouts.md 多方对比行包含 dashboard', () => {
  const hasMultiComp = layouts.includes('多方对比') || layouts.includes('3+');
  const hasDashboard = layouts.includes('dashboard');
  assert(
    hasMultiComp && hasDashboard,
    'layouts.md 应包含"多方对比"或"3+"，且包含"dashboard"'
  );
});

// ======================================================
// styles.md dashboard-dark 不出现在推荐列
// ======================================================

test('规则15: styles.md 推荐表中不包含 dashboard-dark', () => {
  // 找到"内容类型 → 风格推荐"表格部分
  const recommIndex = styles.indexOf('内容类型 → 风格推荐');
  assert(recommIndex !== -1, 'styles.md 应包含"内容类型 → 风格推荐"部分');
  const recommSection = styles.slice(recommIndex);
  assert(
    !recommSection.includes('dashboard-dark'),
    'styles.md 推荐表中不应出现 dashboard-dark'
  );
});

// ======================================================
// setup 规则组
// ======================================================

test('规则16: setup/SKILL.md 包含 compatible_styles', () => {
  assert(
    setupSkill.includes('compatible_styles'),
    'setup/SKILL.md 应包含"compatible_styles"'
  );
});

test('规则17: setup/SKILL.md 包含 theme: "newspaper"', () => {
  assert(
    setupSkill.includes('theme: "newspaper"'),
    'setup/SKILL.md 应包含 theme: "newspaper"'
  );
});

// ======================================================
// 旧文件已删除
// ======================================================

test('规则18: skills/xiaohongshu/references/xhs-card-styles.md 不存在', () => {
  const filePath = path.join(ROOT, 'skills/xiaohongshu/references/xhs-card-styles.md');
  assert(
    !fs.existsSync(filePath),
    'xhs-card-styles.md 应已删除，不应存在于磁盘'
  );
});

test('规则19: skills/wechat/references/infographic-styles.md 不存在', () => {
  const filePath = path.join(ROOT, 'skills/wechat/references/infographic-styles.md');
  assert(
    !fs.existsSync(filePath),
    'infographic-styles.md 应已删除，不应存在于磁盘'
  );
});
