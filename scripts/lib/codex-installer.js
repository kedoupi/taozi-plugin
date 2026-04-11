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

function isSafeEntryName(name) {
  return Boolean(name)
    && !path.isAbsolute(name)
    && !name.includes('..')
    && name === path.basename(name);
}

function assertSafeEntryNames(names, kind) {
  for (const name of names) {
    if (!isSafeEntryName(name)) {
      throw new Error(`refusing unsafe ${kind} entry name: ${name}`);
    }
  }
}

function assertManagedPathInside(rootPath, candidatePath, kind) {
  const resolvedRoot = path.resolve(rootPath);
  const resolvedPath = path.resolve(candidatePath);
  if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(resolvedRoot + path.sep)) {
    throw new Error(`refusing path outside ${kind} root: ${candidatePath}`);
  }
}

function preflightLinks(globalRoot, names, targetRoot, managedPrefixes, kind) {
  assertSafeEntryNames(names, kind);

  for (const name of names) {
    const linkPath = path.join(globalRoot, name);
    const targetPath = path.join(targetRoot, name);
    assertManagedPathInside(globalRoot, linkPath, `${kind} global`);
    assertManagedPathInside(targetRoot, targetPath, `${kind} target`);

    if (pathExists(linkPath) && !isManagedSymlink(linkPath, managedPrefixes)) {
      throw new Error(`refusing to overwrite unmanaged path: ${linkPath}`);
    }
  }
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
  assertSafeEntryNames(previousNames, 'manifest');
  const currentSet = new Set(currentNames);
  for (const name of previousNames) {
    if (currentSet.has(name)) continue;

    const targetPath = path.join(globalRoot, name);
    assertManagedPathInside(globalRoot, targetPath, 'global');
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
  try {
    const previousManifest = readJson(path.join(installRoot, 'install-manifest.json')) || {};
    const { skillNames, agentFiles } = buildTempInstall(repoRoot, tempRoot);

    preflightLinks(
      getGlobalSkillsRoot(codexHome),
      skillNames,
      path.join(tempRoot, 'skills'),
      getManagedPrefixes(repoRoot, installRoot, 'skill'),
      'skill'
    );
    preflightLinks(
      getGlobalAgentsRoot(codexHome),
      agentFiles,
      path.join(tempRoot, 'agents'),
      getManagedPrefixes(repoRoot, installRoot, 'agent'),
      'agent'
    );

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
  } finally {
    if (fs.existsSync(tempRoot)) {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  }
}

module.exports = {
  PLUGIN_NAME,
  getCodexHome,
  getInstallRoot,
  installCodexPlugin,
};
