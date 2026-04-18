#!/usr/bin/env node
/**
 * image-pipeline.test.js — Layer 3: Mock YouMind CLI 集成测试
 *
 * 验证「生图 → 轮询 → 提取 URL → 输出」的完整执行流程。
 * 使用 tests/fixtures/mock-youmind.js 模拟真实 youmind CLI。
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const FIXTURES_DIR = path.join(ROOT, 'tests', 'fixtures');
const MOCK_YOUMIND = path.join(FIXTURES_DIR, 'mock-youmind.js');
const IMAGE_SKILL = path.join(ROOT, 'skills/image/SKILL.md');

// --- 提取 image/SKILL.md 步骤5的 URL 提取脚本 ---

function extractUrlExtractorScript() {
  const content = fs.readFileSync(IMAGE_SKILL, 'utf8');

  // 找到步骤 5 的 python3 代码块
  const step5Idx = content.indexOf('步骤 5：提取图片');
  if (step5Idx === -1) throw new Error('未找到"步骤 5：提取图片"段落');

  const afterStep5 = content.slice(step5Idx);

  // 找到 python3 -c " 的代码块
  const pyStart = afterStep5.indexOf('python3 -c "');
  if (pyStart === -1) throw new Error('步骤 5 中未找到 python3 -c 脚本');

  const pyContent = afterStep5.slice(pyStart + 'python3 -c "'.length);
  // 找到关闭引号（独立一行的 "）
  const pyEnd = pyContent.indexOf('\n"');
  if (pyEnd === -1) throw new Error('步骤 5 python3 脚本未正确关闭');

  return pyContent.slice(0, pyEnd);
}

// --- Helper：运行 mock-youmind ---

function runMock(...args) {
  const result = spawnSync('node', [MOCK_YOUMIND, ...args], {
    encoding: 'utf8',
    timeout: 5000,
  });
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status,
  };
}

// --- 提取 URL 提取脚本（模块加载时执行） ---
const URL_EXTRACTOR_SCRIPT = extractUrlExtractorScript();

// ======================================================
// asyncTest 1: getDefaultBoard 返回正确 boardId
// ======================================================

asyncTest('mock-youmind: getDefaultBoard 返回正确 boardId', async () => {
  const result = runMock('call', 'getDefaultBoard');

  assert.strictEqual(result.status, 0, `exit status 应为 0，实际: ${result.status}`);

  const parsed = JSON.parse(result.stdout.trim());
  assert.strictEqual(
    parsed.id,
    'mock-board-001',
    `boardId 应为 mock-board-001，实际: ${parsed.id}`
  );
  assert.strictEqual(
    parsed.name,
    'Test Board',
    `board name 应为 Test Board，实际: ${parsed.name}`
  );
});

// ======================================================
// asyncTest 2: createChat → getChat 轮询流程
// ======================================================

asyncTest('mock-youmind: createChat → getChat 轮询流程完整', async () => {
  // Step 1: createChat
  const createResult = runMock(
    'call',
    'createChat',
    JSON.stringify({
      boardId: 'mock-board-001',
      message: 'test prompt',
      tools: {
        imageGenerate: {
          useTool: 'required',
          aspectRatio: '16:9',
          quality: 'high',
          model: 'gemini-3-pro-image-preview',
        },
      },
    })
  );

  assert.strictEqual(createResult.status, 0, `createChat 应成功退出，实际 status: ${createResult.status}`);
  const chatData = JSON.parse(createResult.stdout.trim());
  const chatId = chatData.id;
  assert.strictEqual(chatId, 'mock-chat-002', `chatId 应为 mock-chat-002，实际: ${chatId}`);

  // Step 2: getChat 轮询
  const getResult = runMock(
    'call',
    'getChat',
    JSON.stringify({ chatId })
  );

  assert.strictEqual(getResult.status, 0, `getChat 应成功退出，实际 status: ${getResult.status}`);
  const statusData = JSON.parse(getResult.stdout.trim());
  assert.strictEqual(
    statusData.status,
    'completed',
    `status 应为 completed，实际: ${statusData.status}`
  );
});

// ======================================================
// asyncTest 3: listMessages → python3 提取图片 URL
// ======================================================

asyncTest('mock-youmind: listMessages → python3 提取图片 URL 正确', async () => {
  // 运行 mock listMessages 获取 JSON
  const listResult = runMock(
    'call',
    'listMessages',
    JSON.stringify({ chatId: 'mock-chat-002', pageSize: 20 })
  );

  assert.strictEqual(listResult.status, 0, `listMessages 应成功退出，实际 status: ${listResult.status}`);

  // 把 listMessages 的 stdout 作为 stdin 传给 python3 URL 提取脚本
  const pyResult = spawnSync('python3', ['-c', URL_EXTRACTOR_SCRIPT], {
    input: listResult.stdout,
    encoding: 'utf8',
    timeout: 5000,
  });

  assert.strictEqual(
    pyResult.status,
    0,
    `python3 URL 提取脚本应成功退出，stderr: ${pyResult.stderr}`
  );

  const output = pyResult.stdout || '';

  assert(
    output.includes('https://mock.img/test.jpg'),
    `输出应包含图片 URL https://mock.img/test.jpg，实际: ${output}`
  );

  assert(
    output.includes('900'),
    `输出应包含宽度 900，实际: ${output}`
  );

  assert(
    output.includes('383'),
    `输出应包含高度 383，实际: ${output}`
  );
});
