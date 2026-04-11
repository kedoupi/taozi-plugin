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
const TARGET_CODEX_AGENTS_DIR = path.join(ROOT, '.codex', 'agents');
const TARGET_REPO_SKILLS_DIR = path.join(ROOT, '.agents', 'skills');
const CODEX_AGENTS_MANIFEST = path.join(ROOT, '.codex', '.taozi-sync-agents.json');
const CODEX_SKILLS_MANIFEST = path.join(ROOT, '.agents', '.taozi-sync-skills.json');

const MODEL_MAP = {
  opus: { model: 'gpt-5.4', reasoning: 'high' },
  sonnet: { model: 'gpt-5.4-mini', reasoning: 'medium' },
  haiku: { model: 'gpt-5.4-nano', reasoning: 'low' },
};

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

function copyDir(srcDir, dstDir) {
  ensureDir(dstDir);
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const dstPath = path.join(dstDir, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, dstPath);
      continue;
    }

    fs.copyFileSync(srcPath, dstPath);
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
  const content = readFile(agentPath);
  const frontmatter = parseFrontmatter(content);
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
    const targetName = `${path.basename(agentPath, '.md')}.toml`;
    const targetPath = path.join(TARGET_CODEX_AGENTS_DIR, targetName);
    writeFile(targetPath, generateCodexAgent(agentPath));
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
    const targetDir = path.join(TARGET_REPO_SKILLS_DIR, skillName);
    copyDir(path.join(SOURCE_SKILLS_DIR, skillName), targetDir);
    managedEntries.push(path.relative(ROOT, targetDir));
  }

  writeManifest(CODEX_SKILLS_MANIFEST, managedEntries);

  return sourceSkills.length;
}

function main() {
  const agentCount = syncAgents();
  const skillCount = syncSkills();
  process.stdout.write(`Synced ${agentCount} agents and ${skillCount} skills for Codex.\n`);
}

main();
