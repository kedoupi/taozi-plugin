const fs = require('fs');
const os = require('os');
const path = require('path');

const PLUGIN_NAME = 'taozi';

function pathExists(filePath) {
  try {
    fs.lstatSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function listDirs(dirPath) {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
}

function listFiles(dirPath, suffix) {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith(suffix))
    .map(entry => entry.name)
    .sort();
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function getCodexHome(customHome) {
  if (customHome) return path.resolve(customHome);
  if (process.env.CODEX_HOME) return path.resolve(process.env.CODEX_HOME);
  return path.join(os.homedir(), '.codex');
}

function getInstallRoot(codexHome) {
  return path.join(codexHome, 'plugins', PLUGIN_NAME);
}

function getSkillSourceRoot(repoRoot) {
  return path.join(repoRoot, '.agents', 'skills');
}

function getAgentSourceRoot(repoRoot) {
  return path.join(repoRoot, '.codex', 'agents');
}

function getGlobalSkillsRoot(codexHome) {
  return path.join(codexHome, 'skills');
}

function getGlobalAgentsRoot(codexHome) {
  return path.join(codexHome, 'agents');
}

function getManagedPrefixes(repoRoot, installRoot, kind) {
  if (kind === 'skill') {
    return [path.join(installRoot, 'skills'), getSkillSourceRoot(repoRoot)];
  }
  return [path.join(installRoot, 'agents'), getAgentSourceRoot(repoRoot)];
}

function normalizeExistingPath(filePath) {
  try {
    return fs.realpathSync(filePath);
  } catch {
    return path.resolve(filePath);
  }
}

function isManagedSymlink(linkPath, managedPrefixes) {
  try {
    const stat = fs.lstatSync(linkPath);
    if (!stat.isSymbolicLink()) return false;
    const resolved = normalizeExistingPath(linkPath);
    return managedPrefixes
      .map(prefix => normalizeExistingPath(prefix))
      .some(prefix => resolved === prefix || resolved.startsWith(prefix + path.sep));
  } catch {
    return false;
  }
}

function ensureParent(linkPath) {
  ensureDir(path.dirname(linkPath));
}

function ensureLink(linkPath, targetPath, managedPrefixes) {
  if (pathExists(linkPath)) {
    if (isManagedSymlink(linkPath, managedPrefixes)) {
      fs.rmSync(linkPath, { recursive: true, force: true });
    } else {
      throw new Error(`refusing to overwrite unmanaged path: ${linkPath}`);
    }
  }

  ensureParent(linkPath);
  const type = fs.statSync(targetPath).isDirectory() ? 'dir' : 'file';
  fs.symlinkSync(targetPath, linkPath, type);
}

function copyTree(srcPath, dstPath) {
  fs.cpSync(srcPath, dstPath, { recursive: true });
}

function getPackageVersion(repoRoot) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function buildTempInstall(repoRoot, tempRoot) {
  const skillNames = listDirs(getSkillSourceRoot(repoRoot));
  const agentFiles = listFiles(getAgentSourceRoot(repoRoot), '.toml');

  ensureDir(tempRoot);
  copyTree(getSkillSourceRoot(repoRoot), path.join(tempRoot, 'skills'));
  copyTree(getAgentSourceRoot(repoRoot), path.join(tempRoot, 'agents'));

  writeJson(path.join(tempRoot, 'install-manifest.json'), {
    plugin: PLUGIN_NAME,
    version: getPackageVersion(repoRoot),
    installedAt: new Date().toISOString(),
    sourceRepoRoot: path.resolve(repoRoot),
    skillNames,
    agentFiles,
  });

  return { skillNames, agentFiles };
}

function cleanupStaleManagedLinks(globalRoot, currentNames, previousNames, managedPrefixes) {
  const currentSet = new Set(currentNames);
  for (const name of previousNames) {
    if (currentSet.has(name)) continue;

    const targetPath = path.join(globalRoot, name);
    if (pathExists(targetPath) && isManagedSymlink(targetPath, managedPrefixes)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    }
  }
}

function installCodexPlugin(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const codexHome = getCodexHome(options.codexHome);
  const installRoot = getInstallRoot(codexHome);
  const pluginsRoot = path.join(codexHome, 'plugins');
  const tempRoot = path.join(pluginsRoot, `.taozi-tmp-${process.pid}-${Date.now()}`);

  if (!fs.existsSync(getSkillSourceRoot(repoRoot)) || !fs.existsSync(getAgentSourceRoot(repoRoot))) {
    throw new Error('missing generated Codex artifacts; run node scripts/sync-codex.js first');
  }

  ensureDir(pluginsRoot);
  const previousManifest = readJson(path.join(installRoot, 'install-manifest.json')) || {};
  const { skillNames, agentFiles } = buildTempInstall(repoRoot, tempRoot);

  fs.rmSync(installRoot, { recursive: true, force: true });
  fs.renameSync(tempRoot, installRoot);

  const globalSkillsRoot = getGlobalSkillsRoot(codexHome);
  const globalAgentsRoot = getGlobalAgentsRoot(codexHome);
  ensureDir(globalSkillsRoot);
  ensureDir(globalAgentsRoot);

  for (const skillName of skillNames) {
    ensureLink(
      path.join(globalSkillsRoot, skillName),
      path.join(installRoot, 'skills', skillName),
      getManagedPrefixes(repoRoot, installRoot, 'skill')
    );
  }

  for (const agentFile of agentFiles) {
    ensureLink(
      path.join(globalAgentsRoot, agentFile),
      path.join(installRoot, 'agents', agentFile),
      getManagedPrefixes(repoRoot, installRoot, 'agent')
    );
  }

  cleanupStaleManagedLinks(
    globalSkillsRoot,
    skillNames,
    Array.isArray(previousManifest.skillNames) ? previousManifest.skillNames : [],
    getManagedPrefixes(repoRoot, installRoot, 'skill')
  );
  cleanupStaleManagedLinks(
    globalAgentsRoot,
    agentFiles,
    Array.isArray(previousManifest.agentFiles) ? previousManifest.agentFiles : [],
    getManagedPrefixes(repoRoot, installRoot, 'agent')
  );

  return {
    codexHome,
    installRoot,
    skillCount: skillNames.length,
    agentCount: agentFiles.length,
    version: getPackageVersion(repoRoot),
  };
}

module.exports = {
  PLUGIN_NAME,
  getCodexHome,
  getInstallRoot,
  installCodexPlugin,
};
