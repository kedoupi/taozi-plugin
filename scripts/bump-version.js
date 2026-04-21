#!/usr/bin/env node
/**
 * bump-version.js —— 批量升版本号（跨平台，零外部依赖）
 *
 * 同步 package.json / .claude-plugin/plugin.json / .claude-plugin/marketplace.json
 *      / .codex-plugin/plugin.json / README.md
 *
 * 用法:
 *   node scripts/bump-version.js [--dry-run] [--tag] <新版本号>
 *
 * 例:
 *   node scripts/bump-version.js 6.2.0
 *   node scripts/bump-version.js --dry-run 6.2.0
 *   node scripts/bump-version.js --tag 6.2.0
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// --- 参数解析 ---

function parseArgs(argv) {
  let dryRun = false;
  let autoTag = false;
  let version = '';

  for (const arg of argv) {
    if (arg === '--dry-run') dryRun = true;
    else if (arg === '--tag') autoTag = true;
    else if (arg.startsWith('-')) {
      console.error(`未知选项: ${arg}`);
      process.exit(1);
    } else {
      version = arg;
    }
  }

  if (!version) {
    console.error('用法: node scripts/bump-version.js [--dry-run] [--tag] <新版本号>');
    console.error('示例: node scripts/bump-version.js 6.2.0');
    process.exit(1);
  }

  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    console.error('错误：版本号格式不正确，必须为 X.Y.Z（如 6.2.0）');
    process.exit(1);
  }

  return { dryRun, autoTag, version };
}

// --- semver 比较（不依赖外部包） ---

function parseSemver(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) throw new Error(`invalid semver: ${v}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function semverCompare(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

// --- 工具 ---

const ROOT = path.resolve(__dirname, '..');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

function gitWorkingTreeDirty() {
  try {
    execFileSync('git', ['-C', ROOT, 'diff', '--quiet'], { stdio: 'ignore' });
    execFileSync('git', ['-C', ROOT, 'diff', '--cached', '--quiet'], { stdio: 'ignore' });
    return false;
  } catch {
    return true;
  }
}

// --- 更新逻辑 ---

function updateVersionInObject(data, newVersion) {
  if (typeof data.version === 'string') {
    data.version = newVersion;
  }
  if (typeof data.description === 'string') {
    data.description = data.description.replace(/Taozi \d+\.\d+\.\d+/g, `Taozi ${newVersion}`);
  }
  if (Array.isArray(data.plugins)) {
    for (const p of data.plugins) {
      if (p && p.name === 'taozi') {
        p.version = newVersion;
        if (typeof p.description === 'string') {
          p.description = p.description.replace(/Taozi \d+\.\d+\.\d+/g, `Taozi ${newVersion}`);
        }
      }
    }
  }
  return data;
}

function updateJsonFile(label, filePath, newVersion, dryRun) {
  if (dryRun) {
    console.log(`[DRY-RUN] 将更新 ${label}`);
    return;
  }
  const data = readJson(filePath);
  updateVersionInObject(data, newVersion);
  writeJson(filePath, data);
  console.log(`✓ ${label}`);
}

function updateReadmeTitle(readmePath, newVersion, dryRun) {
  if (dryRun) {
    console.log('[DRY-RUN] 将更新 README.md');
    return;
  }
  const text = fs.readFileSync(readmePath, 'utf8');
  const updated = text.replace(/# Taozi Plugin \d+\.\d+(?:\.\d+)?/, `# Taozi Plugin ${newVersion}`);
  fs.writeFileSync(readmePath, updated);
  console.log('✓ README.md');
}

// --- 主流程 ---

function main() {
  const { dryRun, autoTag, version: newVersion } = parseArgs(process.argv.slice(2));

  const PACKAGE_JSON = path.join(ROOT, 'package.json');
  const PLUGIN_JSON = path.join(ROOT, '.claude-plugin', 'plugin.json');
  const MARKETPLACE_JSON = path.join(ROOT, '.claude-plugin', 'marketplace.json');
  const CODEX_PLUGIN_JSON = path.join(ROOT, '.codex-plugin', 'plugin.json');
  const README = path.join(ROOT, 'README.md');

  const currentVersion = readJson(PACKAGE_JSON).version;
  console.log(`当前版本: ${currentVersion}`);
  console.log(`新版本:   ${newVersion}`);
  if (dryRun) console.log('[DRY-RUN 模式：不会写入任何文件]');
  console.log('');

  if (semverCompare(newVersion, currentVersion) <= 0) {
    console.error(`错误：新版本 ${newVersion} 必须大于当前版本 ${currentVersion}`);
    process.exit(1);
  }

  if (!dryRun && gitWorkingTreeDirty()) {
    console.error('错误：git 工作区有未提交的更改，请先 commit 或 stash 后再 bump 版本');
    try {
      execFileSync('git', ['-C', ROOT, 'status', '--short'], { stdio: 'inherit' });
    } catch {}
    process.exit(1);
  }

  updateJsonFile('package.json', PACKAGE_JSON, newVersion, dryRun);
  updateJsonFile('.claude-plugin/plugin.json', PLUGIN_JSON, newVersion, dryRun);
  updateJsonFile('.claude-plugin/marketplace.json', MARKETPLACE_JSON, newVersion, dryRun);
  updateJsonFile('.codex-plugin/plugin.json', CODEX_PLUGIN_JSON, newVersion, dryRun);
  updateReadmeTitle(README, newVersion, dryRun);

  console.log('\n验证结果：');
  const show = (label, file, pick) => {
    try {
      console.log(`  ${label}: ${pick(readJson(file))}`);
    } catch (e) {
      console.log(`  ${label}: 读取失败 (${e.message})`);
    }
  };
  show('package.json',              PACKAGE_JSON,       d => d.version);
  show('plugin.json .version',      PLUGIN_JSON,        d => d.version);
  show('plugin.json .description',  PLUGIN_JSON,        d => d.description);
  show('marketplace version',       MARKETPLACE_JSON,   d => d.plugins[0].version);
  show('marketplace description',   MARKETPLACE_JSON,   d => d.plugins[0].description);
  show('codex plugin version',      CODEX_PLUGIN_JSON,  d => d.version);
  show('codex plugin description',  CODEX_PLUGIN_JSON,  d => d.description);

  try {
    const firstTitle = fs.readFileSync(README, 'utf8').split('\n').find(l => l.startsWith('# Taozi Plugin'));
    if (firstTitle) console.log(`  ${firstTitle}`);
  } catch {}

  if (!dryRun) {
    console.log('\n下一步建议：');
    console.log('  git add package.json .claude-plugin/ .codex-plugin/ README.md');
    console.log(`  git commit -m "chore: bump version to ${newVersion}"`);
    if (autoTag) {
      console.log(`\n正在打 git tag v${newVersion} ...`);
      execFileSync('git', ['-C', ROOT, 'tag', '-a', `v${newVersion}`, '-m', `Release ${newVersion}`], { stdio: 'inherit' });
      console.log(`✓ git tag v${newVersion} 已创建`);
      console.log(`  推送 tag: git push origin v${newVersion}`);
    } else {
      console.log(`  (可选) git tag -a "v${newVersion}" -m "Release ${newVersion}"`);
    }
  }
}

main();
