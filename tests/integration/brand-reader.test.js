#!/usr/bin/env node
/**
 * brand-reader.test.js — Layer 2: Python3 品牌配置读取脚本集成测试
 *
 * 从 wechat/SKILL.md 提取步骤 0 的 python3 脚本，
 * 在各种 fixture 输入下运行它，验证 stdout 输出正确。
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const WECHAT_SKILL = path.join(ROOT, 'skills/wechat/SKILL.md');

// --- 提取 python3 脚本 ---

function extractBrandReaderScript() {
  const content = fs.readFileSync(WECHAT_SKILL, 'utf8');

  // 找到"步骤 0：读取品牌配置"部分的第一个 python3 代码块
  const step0Idx = content.indexOf('步骤 0：读取品牌配置');
  if (step0Idx === -1) throw new Error('未找到"步骤 0：读取品牌配置"段落');

  // 从步骤 0 往后找第一个 python3 -c " 代码块（在 ```bash 块内）
  const afterStep0 = content.slice(step0Idx);

  // 找到 ```bash 开头
  const bashStart = afterStep0.indexOf('```bash\npython3 -c "');
  if (bashStart === -1) throw new Error('未找到步骤 0 的 bash 代码块');

  // 提取代码块内容直到下一个 ```
  const codeStart = bashStart + '```bash\n'.length;
  const blockContent = afterStep0.slice(codeStart);
  const codeEnd = blockContent.indexOf('\n```');
  if (codeEnd === -1) throw new Error('步骤 0 代码块未正确关闭');

  // 提取原始脚本：去掉 python3 -c " 和末尾的 "
  let rawBlock = blockContent.slice(0, codeEnd).trim();
  // rawBlock 应该是: python3 -c "\n...\n"
  // 去掉 python3 -c " 前缀和末尾 "
  const pyPrefix = 'python3 -c "';
  if (!rawBlock.startsWith(pyPrefix)) throw new Error('代码块格式不符合预期');
  rawBlock = rawBlock.slice(pyPrefix.length);
  if (rawBlock.endsWith('"')) rawBlock = rawBlock.slice(0, -1);

  // 替换 HOME 获取方式，改为从环境变量 TAOZI_TEST_HOME 读取（测试注入）
  const script = rawBlock.replace(
    "HOME = os.path.expanduser('~')",
    "HOME = os.environ.get('TAOZI_TEST_HOME', os.path.expanduser('~'))"
  );

  return script;
}

// --- Helper：运行品牌读取脚本 ---

function runBrandScript(scriptText, tmpDir) {
  const result = spawnSync('python3', ['-c', scriptText], {
    encoding: 'utf8',
    env: { ...process.env, TAOZI_TEST_HOME: tmpDir },
    timeout: 10000,
  });
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status,
  };
}

// 提取脚本（模块加载时即执行，任何解析错误会让测试文件加载失败）
const BRAND_SCRIPT = extractBrandReaderScript();

// ======================================================
// asyncTest 1: character.md 存在时
// ======================================================

asyncTest('品牌读取: character.md 存在时输出 CHARACTER_EXISTS:yes', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'taozi-brand-test-'));
  try {
    // 创建 character.md
    const brandDir = path.join(tmpDir, '.taozi', 'brand');
    fs.mkdirSync(brandDir, { recursive: true });

    const characterContent = [
      '# 封面角色设定',
      '',
      '外形：戴圆框眼镜的卡通熊猫，圆润体型，穿黑色卫衣，手持平板电脑',
      '',
      'compatible_styles: [warm, vector-illustration]',
      '',
    ].join('\n');

    fs.writeFileSync(path.join(brandDir, 'character.md'), characterContent, 'utf8');

    // 创建 wechat 平台目录（style.yaml 空文件，不含 palette）
    const wechatDir = path.join(tmpDir, '.taozi', 'platforms', 'wechat');
    fs.mkdirSync(wechatDir, { recursive: true });
    fs.writeFileSync(path.join(wechatDir, 'style.yaml'), 'wechat:\n  appid: test\n', 'utf8');

    const result = runBrandScript(BRAND_SCRIPT, tmpDir);

    assert(
      result.stdout.includes('CHARACTER_EXISTS:yes'),
      `stdout 应包含 CHARACTER_EXISTS:yes，实际: ${result.stdout}`
    );
    assert(
      result.stdout.includes('卡通熊猫') || result.stdout.includes('封面角色设定'),
      `stdout 应包含 character.md 内容片段，实际: ${result.stdout}`
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

// ======================================================
// asyncTest 2: character.md 不存在时
// ======================================================

asyncTest('品牌读取: character.md 不存在时输出 CHARACTER_EXISTS:no', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'taozi-brand-test-'));
  try {
    // 只创建空的 .taozi 目录，不放 character.md
    const taoziDir = path.join(tmpDir, '.taozi');
    fs.mkdirSync(taoziDir, { recursive: true });

    // wechat 目录也要存在，避免 read_platform 报错
    const wechatDir = path.join(tmpDir, '.taozi', 'platforms', 'wechat');
    fs.mkdirSync(wechatDir, { recursive: true });
    fs.writeFileSync(path.join(wechatDir, 'style.yaml'), 'wechat:\n  appid: test\n', 'utf8');

    const result = runBrandScript(BRAND_SCRIPT, tmpDir);

    assert(
      result.stdout.includes('CHARACTER_EXISTS:no'),
      `stdout 应包含 CHARACTER_EXISTS:no，实际: ${result.stdout}`
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

// ======================================================
// asyncTest 3: style.yaml 有 palette 字段时
// ======================================================

asyncTest('品牌读取: style.yaml 含 palette 时正确提取 PALETTE', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'taozi-brand-test-'));
  try {
    // 不创建 character.md（只测 palette）
    const wechatDir = path.join(tmpDir, '.taozi', 'platforms', 'wechat');
    fs.mkdirSync(wechatDir, { recursive: true });

    const styleContent = [
      'wechat:',
      '  appid: wx_test',
      '  secret: secret_test',
      'palette: "warm orange, cream white"',
    ].join('\n');

    fs.writeFileSync(path.join(wechatDir, 'style.yaml'), styleContent, 'utf8');

    const result = runBrandScript(BRAND_SCRIPT, tmpDir);

    assert(
      result.stdout.includes('PALETTE:warm orange, cream white'),
      `stdout 应包含 PALETTE:warm orange, cream white，实际: ${result.stdout}`
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});

// ======================================================
// asyncTest 4: style.yaml 无 palette 字段时
// ======================================================

asyncTest('品牌读取: style.yaml 无 palette 时 PALETTE 值为空', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'taozi-brand-test-'));
  try {
    const wechatDir = path.join(tmpDir, '.taozi', 'platforms', 'wechat');
    fs.mkdirSync(wechatDir, { recursive: true });

    // 只有凭据，无 palette 行
    const styleContent = [
      'wechat:',
      '  appid: wx_test',
      '  secret: secret_test',
    ].join('\n');

    fs.writeFileSync(path.join(wechatDir, 'style.yaml'), styleContent, 'utf8');

    const result = runBrandScript(BRAND_SCRIPT, tmpDir);

    // PALETTE: 后面的值应为空（仅行尾换行）
    assert(
      result.stdout.includes('PALETTE:'),
      `stdout 应包含 PALETTE: 行，实际: ${result.stdout}`
    );

    // 提取 PALETTE: 行的值，确认为空
    const paletteLine = result.stdout
      .split('\n')
      .find((l) => l.startsWith('PALETTE:'));
    const paletteValue = paletteLine ? paletteLine.slice('PALETTE:'.length).trim() : 'NOT_FOUND';
    assert.strictEqual(
      paletteValue,
      '',
      `PALETTE 值应为空字符串，实际: "${paletteValue}"`
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true });
  }
});
