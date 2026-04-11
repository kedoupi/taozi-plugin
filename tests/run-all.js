#!/usr/bin/env node
/**
 * Taozi Plugin - 测试运行器
 * 零依赖，纯 Node.js assert
 *
 * 用法: node tests/run-all.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const testsDir = path.join(__dirname);

// --- 测试框架 ---

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];
const pendingAsyncTests = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    process.stdout.write(`  ✓ ${name}\n`);
  } catch (err) {
    failedTests++;
    failures.push({ name, error: err.message });
    process.stdout.write(`  ✗ ${name}\n`);
    process.stdout.write(`    ${err.message}\n`);
  }
}

async function asyncTest(name, fn) {
  const promise = (async () => {
    totalTests++;
    try {
      await fn();
      passedTests++;
      process.stdout.write(`  ✓ ${name}\n`);
    } catch (err) {
      failedTests++;
      failures.push({ name, error: err.message });
      process.stdout.write(`  ✗ ${name}\n`);
      process.stdout.write(`    ${err.message}\n`);
    }
  })();

  pendingAsyncTests.push(promise);
  return promise;
}

// 导出给子测试文件使用
global.test = test;
global.asyncTest = asyncTest;
global.assert = assert;

// --- 发现并运行所有测试文件 ---

function findTestFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findTestFiles(fullPath));
    } else if (entry.name.endsWith('.test.js')) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

async function runAllTests() {
  const testFiles = findTestFiles(testsDir);

  console.log('\n🍑 Taozi Plugin 测试套件\n');
  console.log(`发现 ${testFiles.length} 个测试文件\n`);

  for (const file of testFiles) {
    const relativePath = path.relative(testsDir, file);
    console.log(`\n📋 ${relativePath}`);

    try {
      // 加载测试文件，它会自动注册 test() 调用
      require(file);
    } catch (err) {
      failedTests++;
      failures.push({ name: `加载 ${relativePath}`, error: err.message });
      console.log(`  ✗ 测试文件加载失败: ${err.message}`);
    }

    // 清除 require 缓存
    delete require.cache[file];
  }

  if (pendingAsyncTests.length > 0) {
    await Promise.allSettled(pendingAsyncTests);
  }

  // --- 汇总 ---

  console.log('\n────────────────────────────────────');
  console.log(`总计: ${totalTests} | ✓ 通过: ${passedTests} | ✗ 失败: ${failedTests}`);
  console.log('────────────────────────────────────\n');

  if (failures.length > 0) {
    console.log('失败项:');
    for (const f of failures) {
      console.log(`  • ${f.name}: ${f.error}`);
    }
    console.log('');
    process.exit(1);
  }

  process.exit(0);
}

runAllTests().catch((err) => {
  console.log(`\n✗ 测试运行器异常: ${err.message}`);
  process.exit(1);
});
