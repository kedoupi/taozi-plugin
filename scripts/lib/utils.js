/**
 * Taozi Plugin - 跨平台工具库
 * 所有 hook 脚本共享的工具函数
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// --- 日志 ---

function log(msg) {
  process.stderr.write(`[Taozi] ${msg}\n`);
}

function warn(msg) {
  process.stderr.write(`[Taozi WARN] ${msg}\n`);
}

function error(msg) {
  process.stderr.write(`[Taozi ERROR] ${msg}\n`);
}

// --- Stdin JSON 解析 ---

function readStdinJson() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function execGitLines(command, cwd) {
  try {
    const output = execSync(command, {
      cwd: cwd || process.cwd(),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return output ? output.split('\n').filter(Boolean) : [];
  } catch {
    return [];
  }
}

// --- 文件操作 ---

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function readJson(filePath) {
  const content = readFile(filePath);
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function writeJson(filePath, data) {
  writeFile(filePath, JSON.stringify(data, null, 2) + '\n');
}

// --- 文件搜索 ---

function findFiles(dir, pattern) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const regex = new RegExp(pattern);
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, pattern));
    } else if (regex.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

// --- Git 工具 ---

function isGitRepo(cwd) {
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      cwd: cwd || process.cwd(),
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

function getGitRoot(cwd) {
  try {
    return execSync('git rev-parse --show-toplevel', {
      cwd: cwd || process.cwd(),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

function getGitModifiedFiles(cwd) {
  const files = new Set([
    ...execGitLines('git diff --name-only --', cwd),
    ...execGitLines('git diff --name-only --cached --', cwd),
    ...execGitLines('git ls-files --others --exclude-standard', cwd),
  ]);

  return Array.from(files).sort();
}

// --- 日期工具 ---

function getDateString() {
  return new Date().toISOString().split('T')[0];
}

function getDateTimeString() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

// --- Taozi 数据目录 ---

function getTaoziDir() {
  const envDir = process.env.TAOZI_HOME;
  if (envDir) return path.resolve(envDir);

  const modernDir = path.join(os.homedir(), '.taozi');
  const legacyDir = path.join(os.homedir(), '.claude', 'taozi');

  if (fs.existsSync(modernDir)) return modernDir;
  if (fs.existsSync(legacyDir)) return legacyDir;

  return modernDir;
}

function getSessionsDir() {
  return path.join(getTaoziDir(), 'sessions');
}

function getLearnedDir() {
  return path.join(getTaoziDir(), 'learned');
}

// --- 插件根目录 ---

function getPluginRoot() {
  // 优先使用环境变量
  const envRoots = [
    process.env.TAOZI_PLUGIN_ROOT,
    process.env.CLAUDE_PLUGIN_ROOT,
    process.env.CODEX_PLUGIN_ROOT,
  ].filter(Boolean);

  for (const envRoot of envRoots) {
    if (fs.existsSync(path.join(envRoot, 'scripts', 'lib', 'utils.js'))) {
      return path.resolve(envRoot);
    }
  }

  // 从当前文件向上推导
  const inferredRoot = path.resolve(__dirname, '..', '..');
  if (fs.existsSync(path.join(inferredRoot, 'scripts', 'lib', 'utils.js'))) {
    return inferredRoot;
  }

  // 常见安装路径
  const home = os.homedir();
  const candidates = [
    path.join(home, '.claude', 'plugins', 'taozi'),
    path.join(home, '.claude', 'plugins', 'taozi-plugin'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'scripts', 'lib', 'utils.js'))) {
      return candidate;
    }
  }

  return null;
}

// --- YAML Frontmatter 解析 ---

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    if (!line.trim()) continue;
    // Taozi only supports flat `key: value` frontmatter fields.
    if (/^\s/.test(line) || /^-\s/.test(line)) {
      return null;
    }
    const colonIdx = line.indexOf(':');
    if (colonIdx <= 0 || colonIdx === line.length - 1) return null;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (!key || !value) return null;
    frontmatter[key] = value;
  }
  return frontmatter;
}

// --- 导出 ---

module.exports = {
  log,
  warn,
  error,
  readStdinJson,
  ensureDir,
  readFile,
  writeFile,
  readJson,
  writeJson,
  findFiles,
  isGitRepo,
  getGitRoot,
  getGitModifiedFiles,
  getDateString,
  getDateTimeString,
  getTaoziDir,
  getSessionsDir,
  getLearnedDir,
  getPluginRoot,
  parseFrontmatter,
};
