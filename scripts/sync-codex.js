#!/usr/bin/env node
/**
 * Generate Codex-facing artifacts from Taozi's canonical agents/skills source.
 *
 * Source of truth:
 * - agents/*.md
 * - skills/...
 *
 * Generated output:
 * - .codex/agents/*.toml
 * - .agents/skills/...
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_AGENTS_DIR = path.join(ROOT, 'agents');
const SOURCE_SKILLS_DIR = path.join(ROOT, 'skills');
const SOURCE_HOOKS_JSON = path.join(ROOT, 'hooks', 'hooks.json');
const README_PATH = path.join(ROOT, 'README.md');
const TARGET_CODEX_AGENTS_DIR = path.join(ROOT, '.codex', 'agents');
const TARGET_CODEX_HOOKS_JSON = path.join(ROOT, '.codex', 'hooks.json');
const TARGET_REPO_SKILLS_DIR = path.join(ROOT, '.agents', 'skills');
const CODEX_AGENTS_MANIFEST = path.join(ROOT, '.codex', '.taozi-sync-agents.json');
const CODEX_SKILLS_MANIFEST = path.join(ROOT, '.agents', '.taozi-sync-skills.json');

const MODEL_MAP = {
  opus: { model: 'gpt-5.4', reasoning: 'high' },
  sonnet: { model: 'gpt-5.4-mini', reasoning: 'medium' },
  haiku: { model: 'gpt-5.4-nano', reasoning: 'low' },
};

const README_CATALOG_MARKERS = {
  agents: 'agents',
  skills: 'skills',
  rules: 'rules',
  hooks: 'hooks',
};

const YOUMIND_SKILL_NAMES = [
  'image',
  'infographic',
  'research',
  'clip',
  'ppt',
  'webpage',
  'wechat',
  'xiaohongshu',
];

const WORKFLOW_SKILL_NAMES = [
  'taozi',
  'plan',
  'tdd',
  'verify',
  'debug',
  'finish',
  'code-review',
  'quality-gate',
  'commit',
  'worktree',
  'update-context',
  'model-route',
  'learning',
  'multi-plan',
  'multi-execute',
  'build-fix',
  'checkpoint',
  'ultra-think',
  'evolve',
  'harness-audit',
  'instinct-status',
  'instinct-import',
  'instinct-export',
  'skill-create',
  'security-scan',
  'setup',
  'lark',
];

const AGENT_LAYERS = [
  { title: '编排层', names: ['chief-of-staff'] },
  { title: '执行层', names: ['fullstack-developer', 'devops-engineer', 'debugger', 'build-error-resolver'] },
  { title: '规划层', names: ['architect', 'planner'] },
  {
    title: '质量层',
    names: [
      'code-reviewer',
      'typescript-reviewer',
      'python-reviewer',
      'go-reviewer',
      'java-reviewer',
      'cpp-reviewer',
      'csharp-reviewer',
      'kotlin-reviewer',
      'rust-reviewer',
      'flutter-reviewer',
      'testing-engineer',
      'tdd-guide',
      'e2e-runner',
      'security-reviewer',
    ],
  },
  {
    title: '语言构建修复层',
    names: [
      'cpp-build-resolver',
      'csharp-build-resolver',
      'flutter-build-resolver',
      'go-build-resolver',
      'java-build-resolver',
      'kotlin-build-resolver',
      'python-build-resolver',
      'rust-build-resolver',
    ],
  },
  { title: '优化层', names: ['refactoring-specialist', 'performance-engineer', 'refactor-cleaner'] },
  { title: '支撑层', names: ['documentation-engineer', 'doc-updater', 'context-manager', 'prompt-engineer'] },
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function resetDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  ensureDir(dirPath);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function writeJson(filePath, value) {
  writeFile(filePath, JSON.stringify(value, null, 2) + '\n');
}

function parseArgs(argv) {
  const args = { checkOnly: false };
  for (const arg of argv) {
    if (arg === '--check') {
      args.checkOnly = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      process.stdout.write('Usage: node scripts/sync-codex.js [--check]\n');
      process.exit(0);
    }
    throw new Error(`unknown argument: ${arg}`);
  }
  return args;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    if (!line.trim()) continue;
    if (/^\s/.test(line) || /^-\s/.test(line)) {
      throw new Error('unsupported frontmatter: only flat key: value lines are allowed');
    }
    const colonIdx = line.indexOf(':');
    if (colonIdx <= 0 || colonIdx === line.length - 1) {
      throw new Error('unsupported frontmatter: only flat key: value lines are allowed');
    }
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (!key || !value) {
      throw new Error('unsupported frontmatter: only flat key: value lines are allowed');
    }
    frontmatter[key] = value;
  }
  return frontmatter;
}

function getBody(content) {
  const match = content.match(/^---\n[\s\S]*?\n---\n?/);
  return (match ? content.slice(match[0].length) : content).trim();
}

function parseSkillFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (line.startsWith(' ') || line.startsWith('\t') || line.trim().startsWith('-')) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx <= 0) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!key || !value) continue;
    frontmatter[key] = value;
  }
  return frontmatter;
}

function escapeTomlString(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function escapeTomlMultiline(value) {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\\/g, '\\\\')
    .replace(/"""/g, '\\"\\"\\"');
}

function listMarkdownFiles(dirPath) {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => path.join(dirPath, entry.name))
    .sort();
}

function listSkillDirs(dirPath) {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
}

function listFilesRecursive(dirPath) {
  const files = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(fullPath));
      continue;
    }
    files.push(fullPath);
  }
  return files.sort();
}

// 始终跳过的目录/文件（构建缓存、OS 元数据等）
const IGNORED_DIR_NAMES = new Set(['__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache']);
const IGNORED_FILE_EXTS = new Set(['.pyc', '.pyo']);

function copyDir(srcDir, dstDir) {
  ensureDir(dstDir);
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIR_NAMES.has(entry.name)) continue;
      copyDir(path.join(srcDir, entry.name), path.join(dstDir, entry.name));
      continue;
    }

    if (IGNORED_FILE_EXTS.has(path.extname(entry.name))) continue;
    if (entry.name === '.DS_Store') continue;

    fs.copyFileSync(path.join(srcDir, entry.name), path.join(dstDir, entry.name));
  }
}

function cleanupManagedEntries(manifestPath) {
  const manifest = readJson(manifestPath);
  if (!manifest || !Array.isArray(manifest.entries)) return;

  for (const relativeEntry of manifest.entries) {
    const absoluteEntry = path.resolve(ROOT, relativeEntry);
    if (absoluteEntry !== ROOT && !absoluteEntry.startsWith(ROOT + path.sep)) {
      throw new Error(`refusing to remove path outside repo root: ${relativeEntry}`);
    }
    fs.rmSync(absoluteEntry, { recursive: true, force: true });
  }
}

function writeManifest(manifestPath, entries) {
  writeJson(manifestPath, {
    generatedAt: new Date().toISOString(),
    entries: entries.sort(),
  });
}

function inferSandboxMode(toolsValue) {
  const tools = String(toolsValue || '')
    .split(',')
    .map(tool => tool.trim())
    .filter(Boolean);

  return tools.includes('Write') || tools.includes('Edit') ? 'workspace-write' : 'read-only';
}

function buildDeveloperInstructions(agentPath, sandboxMode, body) {
  const sourcePath = path.relative(ROOT, agentPath);
  const prelude = [
    `This custom agent mirrors Taozi's canonical definition from ${sourcePath}.`,
    'Stay within this specialty and return concise, actionable results to the parent agent.',
    sandboxMode === 'read-only'
      ? 'Do not edit files. Focus on evidence, risks, and concrete guidance.'
      : 'When editing, make the smallest defensible change, keep unrelated files untouched, and do not revert user changes.',
  ].join('\n');

  return `${prelude}\n\n${body}`.trim();
}

function generateCodexAgent(agentPath) {
  let frontmatter;
  try {
    frontmatter = parseFrontmatter(readFile(agentPath));
  } catch (e) {
    console.warn(`[sync-codex] skipping ${path.relative(ROOT, agentPath)}: ${e.message}`);
    return null;
  }
  if (!frontmatter.name) {
    console.warn(`[sync-codex] skipping ${path.relative(ROOT, agentPath)}: missing 'name' in frontmatter`);
    return null;
  }
  const content = readFile(agentPath);
  const body = getBody(content);
  const modelConfig = MODEL_MAP[frontmatter.model] || MODEL_MAP.sonnet;
  const sandboxMode = inferSandboxMode(frontmatter.tools);
  const developerInstructions = buildDeveloperInstructions(agentPath, sandboxMode, body);

  return [
    `name = "${escapeTomlString(frontmatter.name)}"`,
    `description = "${escapeTomlString(frontmatter.description || '')}"`,
    `model = "${modelConfig.model}"`,
    `model_reasoning_effort = "${modelConfig.reasoning}"`,
    `sandbox_mode = "${sandboxMode}"`,
    'developer_instructions = """',
    escapeTomlMultiline(developerInstructions),
    '"""',
    '',
  ].join('\n');
}

function syncAgents() {
  ensureDir(TARGET_CODEX_AGENTS_DIR);
  cleanupManagedEntries(CODEX_AGENTS_MANIFEST);
  const sourceAgents = listMarkdownFiles(SOURCE_AGENTS_DIR);
  const managedEntries = [];

  for (const agentPath of sourceAgents) {
    const toml = generateCodexAgent(agentPath);
    if (toml === null) continue;
    const targetName = `${path.basename(agentPath, '.md')}.toml`;
    const targetPath = path.join(TARGET_CODEX_AGENTS_DIR, targetName);
    writeFile(targetPath, toml);
    managedEntries.push(path.relative(ROOT, targetPath));
  }

  writeManifest(CODEX_AGENTS_MANIFEST, managedEntries);

  return sourceAgents.length;
}

function syncSkills() {
  ensureDir(TARGET_REPO_SKILLS_DIR);
  cleanupManagedEntries(CODEX_SKILLS_MANIFEST);

  const sourceSkills = fs
    .readdirSync(SOURCE_SKILLS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
  const managedEntries = [];

  for (const skillName of sourceSkills) {
    const skillMd = path.join(SOURCE_SKILLS_DIR, skillName, 'SKILL.md');
    if (!fs.existsSync(skillMd)) {
      console.warn(`[sync-codex] skipping skills/${skillName}: no SKILL.md found`);
      continue;
    }
    const targetDir = path.join(TARGET_REPO_SKILLS_DIR, skillName);
    copyDir(path.join(SOURCE_SKILLS_DIR, skillName), targetDir);
    managedEntries.push(path.relative(ROOT, targetDir));
  }

  writeManifest(CODEX_SKILLS_MANIFEST, managedEntries);

  return sourceSkills.length;
}

// Codex 只认 PreToolUse 事件（其他 hook 事件为 Claude 专有）。
// 这些 hook 也跑在 Codex 侧以保证双运行时的安全护栏一致：
//   no-verify-guard / tmux-hint / youmind-key-check / wechat-key-check / git-commit-guard
// 新增到 hooks/hooks.json 的 PreToolUse hook 会自动随 sync 同步。
function buildCodexHookCommand(hookFile) {
  // 在 Codex 运行时内联 Node 解析脚本位置：优先 CODEX_PLUGIN_ROOT，
  // 回退 ~/.codex/plugins/taozi，再回退当前 git 仓库根。
  return (
    "node -e \"const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');" +
    `const hook='${hookFile}';` +
    "const roots=[];" +
    "if(process.env.CODEX_PLUGIN_ROOT) roots.push(process.env.CODEX_PLUGIN_ROOT);" +
    "const home=process.env.CODEX_HOME?path.resolve(process.env.CODEX_HOME):path.join(os.homedir(),'.codex');" +
    "roots.push(path.join(home,'plugins','taozi'));" +
    "try{roots.push(cp.execSync('git rev-parse --show-toplevel',{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim())}catch{}" +
    "const root=roots.find(p=>p&&fs.existsSync(path.join(p,'scripts','hooks',hook)));" +
    "if(!root){console.error('[Taozi] Unable to locate Codex hook root');process.exit(1)}" +
    "require(path.join(root,'scripts','hooks',hook));\""
  );
}

function extractHookFileName(claudeCommand) {
  const m = claudeCommand.match(/scripts\/hooks\/([A-Za-z0-9_\-.]+\.js)/);
  return m ? m[1] : null;
}

function syncHooks() {
  const claudeHooks = readJson(SOURCE_HOOKS_JSON);
  if (!claudeHooks || !claudeHooks.hooks || !Array.isArray(claudeHooks.hooks.PreToolUse)) {
    console.warn('[sync-codex] hooks/hooks.json missing PreToolUse; skipping Codex hooks sync');
    return 0;
  }

  const codexPre = [];
  let total = 0;
  for (const group of claudeHooks.hooks.PreToolUse) {
    const codexGroup = { matcher: group.matcher || 'Bash', hooks: [] };
    for (const h of group.hooks || []) {
      const hookFile = extractHookFileName(h.command || '');
      if (!hookFile) continue;
      codexGroup.hooks.push({
        type: 'command',
        command: buildCodexHookCommand(hookFile),
        statusMessage: (group.description || `Running ${hookFile}`).slice(0, 120),
      });
      total += 1;
    }
    if (codexGroup.hooks.length) codexPre.push(codexGroup);
  }

  writeJson(TARGET_CODEX_HOOKS_JSON, {
    hooks: { PreToolUse: codexPre },
  });

  return total;
}

function readAgentCatalogEntries() {
  const entries = [];
  for (const agentPath of listMarkdownFiles(SOURCE_AGENTS_DIR)) {
    let frontmatter;
    try {
      frontmatter = parseFrontmatter(readFile(agentPath));
    } catch (e) {
      console.warn(`[sync-codex] skipping ${path.relative(ROOT, agentPath)} for README catalog: ${e.message}`);
      continue;
    }
    if (!frontmatter.name || !frontmatter.description) {
      console.warn(`[sync-codex] skipping ${path.relative(ROOT, agentPath)} for README catalog: missing name/description`);
      continue;
    }
    entries.push({
      file: path.basename(agentPath, '.md'),
      name: frontmatter.name,
      description: frontmatter.description,
    });
  }
  return entries;
}

function readSkillCatalogEntries() {
  const entries = [];
  for (const skillName of listSkillDirs(SOURCE_SKILLS_DIR)) {
    const skillPath = path.join(SOURCE_SKILLS_DIR, skillName, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      console.warn(`[sync-codex] skipping skills/${skillName} for README catalog: no SKILL.md found`);
      continue;
    }
    const frontmatter = parseSkillFrontmatter(readFile(skillPath));
    if (!frontmatter.name || !frontmatter.description) {
      console.warn(`[sync-codex] skipping skills/${skillName} for README catalog: missing name/description`);
      continue;
    }
    entries.push({
      dir: skillName,
      name: frontmatter.name,
      description: frontmatter.description,
    });
  }
  return entries;
}

function buildEntryMap(entries, label) {
  const map = new Map();
  for (const entry of entries) {
    if (map.has(entry.name)) {
      throw new Error(`duplicate ${label} name in catalog source: ${entry.name}`);
    }
    map.set(entry.name, entry);
  }
  return map;
}

function assertNamesExist(names, entryMap, label) {
  for (const name of names) {
    if (!entryMap.has(name)) {
      throw new Error(`missing ${label} entry in catalog source: ${name}`);
    }
  }
}

function escapeMarkdownCell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function formatInlineNameList(names) {
  return names.map(name => `\`${name}\``).join(' · ');
}

function buildAgentsCatalog(entries) {
  const entryMap = buildEntryMap(entries, 'agent');
  const seen = new Set();
  const lines = [`## Agents（${entries.length} 个）`, ''];

  for (const layer of AGENT_LAYERS) {
    assertNamesExist(layer.names, entryMap, 'agent');
    lines.push(`### ${layer.title}`, '| Agent | 专长 |', '|-------|------|');
    for (const name of layer.names) {
      seen.add(name);
      const entry = entryMap.get(name);
      lines.push(`| ${entry.name} | ${escapeMarkdownCell(entry.description)} |`);
    }
    lines.push('');
  }

  const unassigned = entries.map(entry => entry.name).filter(name => !seen.has(name));
  if (unassigned.length > 0) {
    throw new Error(`unassigned agents in README catalog: ${unassigned.join(', ')}`);
  }

  return lines.join('\n').trimEnd();
}

function buildSkillsCatalog(entries) {
  const entryMap = buildEntryMap(entries, 'skill');
  assertNamesExist(WORKFLOW_SKILL_NAMES, entryMap, 'workflow skill');
  assertNamesExist(YOUMIND_SKILL_NAMES, entryMap, 'YouMind skill');

  const workflowSet = new Set(WORKFLOW_SKILL_NAMES);
  const youmindSet = new Set(YOUMIND_SKILL_NAMES);
  const overlap = WORKFLOW_SKILL_NAMES.filter(name => youmindSet.has(name));
  if (overlap.length > 0) {
    throw new Error(`workflow/YouMind skill overlap in README catalog: ${overlap.join(', ')}`);
  }

  const knowledgeNames = entries
    .map(entry => entry.name)
    .filter(name => !workflowSet.has(name) && !youmindSet.has(name))
    .sort();

  const lines = [
    `## Skills（${entries.length} 个）`,
    '',
    'Claude / Codex 根据任务自动引用相关知识库；同时 `/taozi:<name>` 手动触发工作流类 skill。',
    '',
    `### 工作流 Skills（${WORKFLOW_SKILL_NAMES.length} 个，带 \`/taozi:\` 触发）`,
    '',
    formatInlineNameList(WORKFLOW_SKILL_NAMES),
    '',
    `### 开发知识库（${knowledgeNames.length} 个，自动引用）`,
    '',
    formatInlineNameList(knowledgeNames),
    '',
    `### YouMind 创作 Skills（${YOUMIND_SKILL_NAMES.length} 个）`,
    '',
    formatInlineNameList(YOUMIND_SKILL_NAMES),
  ];

  return lines.join('\n').trimEnd();
}

function countRuleFiles() {
  return listFilesRecursive(path.join(ROOT, 'rules')).length;
}

function countAllHookEntries() {
  const hooksConfig = readJson(SOURCE_HOOKS_JSON);
  if (!hooksConfig || !hooksConfig.hooks) {
    throw new Error('hooks/hooks.json is missing or invalid');
  }

  return Object.values(hooksConfig.hooks).reduce((sum, entries) => {
    return sum + (Array.isArray(entries) ? entries.length : 0);
  }, 0);
}

function getCatalogToken(name, side) {
  return `<!-- catalog:${name}:${side} -->`;
}

function getCatalogRegion(content, name) {
  const startToken = getCatalogToken(name, 'start');
  const endToken = getCatalogToken(name, 'end');
  const startIdx = content.indexOf(startToken);
  const endIdx = content.indexOf(endToken);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(`README catalog markers not found for ${name}`);
  }

  const bodyStart = startIdx + startToken.length;
  return {
    startToken,
    endToken,
    startIdx,
    endIdx,
    body: content.slice(bodyStart, endIdx),
  };
}

function replaceCatalogRegion(content, name, replacement) {
  const region = getCatalogRegion(content, name);
  const before = content.slice(0, region.startIdx + region.startToken.length);
  const after = content.slice(region.endIdx);
  return `${before}\n${replacement.trim()}\n${after}`;
}

function replaceHeadingInRegion(regionBody, expectedLabel, nextHeading) {
  const headingRegex = new RegExp(`^## ${expectedLabel}（\\d+ 个[^\\n]*）$`, 'm');
  if (!headingRegex.test(regionBody)) {
    throw new Error(`README catalog region missing heading: ${expectedLabel}`);
  }
  return regionBody.replace(headingRegex, nextHeading);
}

function syncReadmeCatalog(checkOnly) {
  const originalReadme = readFile(README_PATH);
  if (!originalReadme) {
    throw new Error('README.md not found');
  }

  const agents = readAgentCatalogEntries();
  const skills = readSkillCatalogEntries();
  const rulesCount = countRuleFiles();
  const hooksCount = countAllHookEntries();

  let nextReadme = replaceCatalogRegion(originalReadme, README_CATALOG_MARKERS.agents, buildAgentsCatalog(agents));
  nextReadme = replaceCatalogRegion(nextReadme, README_CATALOG_MARKERS.skills, buildSkillsCatalog(skills));

  const rulesRegion = getCatalogRegion(nextReadme, README_CATALOG_MARKERS.rules).body;
  nextReadme = replaceCatalogRegion(
    nextReadme,
    README_CATALOG_MARKERS.rules,
    replaceHeadingInRegion(rulesRegion, 'Rules', `## Rules（${rulesCount} 个规则文件）`)
  );

  const hooksRegion = getCatalogRegion(nextReadme, README_CATALOG_MARKERS.hooks).body;
  nextReadme = replaceCatalogRegion(
    nextReadme,
    README_CATALOG_MARKERS.hooks,
    replaceHeadingInRegion(hooksRegion, 'Hooks', `## Hooks（${hooksCount} 个自动化钩子）`)
  );

  const counts = {
    agents: agents.length,
    skills: skills.length,
    rules: rulesCount,
    hooks: hooksCount,
  };
  const changed = nextReadme !== originalReadme;

  if (!checkOnly && changed) {
    writeFile(README_PATH, nextReadme);
  }

  return { changed, counts };
}

function main() {
  const { checkOnly } = parseArgs(process.argv.slice(2));
  if (checkOnly) {
    const result = syncReadmeCatalog(true);
    if (result.changed) {
      process.stderr.write('README catalog is out of sync. Run: node scripts/sync-codex.js\n');
      process.exit(1);
    }
    process.stdout.write(
      `README catalog check: OK  (agents: ${result.counts.agents}, skills: ${result.counts.skills}, rules: ${result.counts.rules}, hooks: ${result.counts.hooks})\n`
    );
    return;
  }

  const agentCount = syncAgents();
  const skillCount = syncSkills();
  const hookCount = syncHooks();
  const readmeCatalog = syncReadmeCatalog(false);
  process.stdout.write(
    `Synced ${agentCount} agents, ${skillCount} skills, and ${hookCount} Codex PreToolUse hooks.\n`
  );
  process.stdout.write(
    `Synced README catalog (agents: ${readmeCatalog.counts.agents}, skills: ${readmeCatalog.counts.skills}, rules: ${readmeCatalog.counts.rules}, hooks: ${readmeCatalog.counts.hooks}).\n`
  );
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
