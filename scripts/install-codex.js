#!/usr/bin/env node

const path = require('path');
const { execFileSync } = require('child_process');
const { installCodexPlugin } = require('./lib/codex-installer');

function parseArgs(argv) {
  const args = { repoRoot: path.resolve(__dirname, '..') };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--codex-home') {
      args.codexHome = argv[++i];
    } else if (arg === '--repo-root') {
      args.repoRoot = argv[++i];
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  process.stdout.write(
    [
      'Usage: node scripts/install-codex.js [--codex-home <path>] [--repo-root <path>]',
      '',
      'Installs Taozi for Codex into a stable vendor directory under ~/.codex/plugins/taozi',
      'and links global skills/agents to that fixed copy so branch switches do not break the install.',
      '',
    ].join('\n')
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  execFileSync('node', [path.join(args.repoRoot, 'scripts', 'sync-codex.js')], {
    cwd: args.repoRoot,
    stdio: 'inherit',
  });

  const result = installCodexPlugin(args);
  process.stdout.write(
    [
      '',
      `Installed Taozi ${result.version} for Codex.`,
      `Install root: ${result.installRoot}`,
      `Linked ${result.skillCount} skills and ${result.agentCount} agents into ${result.codexHome}.`,
      '',
    ].join('\n')
  );
}

main();
