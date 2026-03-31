'use strict';

/**
 * Resolve dynamo-os planning toolkit + dynamo-os.config when available.
 * Falls back to wbs-capability-folder.js in scripts that require it.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

/** @returns {string|null} */
function findToolkitLibDir() {
  const envLib = process.env.DYNAMO_PLAN_LIB;
  const candidates = [
    envLib ? path.resolve(envLib) : null,
    path.join(PROJECT_ROOT, 'node_modules', 'dynamo-os-planning-toolkit', 'lib'),
    path.join(PROJECT_ROOT, '..', 'dynamo-os', 'planning-toolkit', 'lib'),
  ].filter(Boolean);
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'load-config.js'))) return dir;
  }
  return null;
}

/**
 * @returns {{ projectRoot: string, config: object, getCapabilityFolder: (id: string) => string } | null}
 */
function resolvePlanningContext() {
  const libDir = findToolkitLibDir();
  if (!libDir) return null;
  try {
    const { loadConfig } = require(path.join(libDir, 'load-config.js'));
    const { getCapabilityFolder } = require(path.join(libDir, 'paths.js'));
    const { projectRoot, config } = loadConfig(PROJECT_ROOT);
    return {
      projectRoot,
      config,
      getCapabilityFolder(capId) {
        return getCapabilityFolder(projectRoot, config.capabilities, String(capId || '').toUpperCase());
      },
    };
  } catch (e) {
    if (e.code === 'CONFIG_NOT_FOUND') return null;
    throw e;
  }
}

module.exports = {
  PROJECT_ROOT,
  findToolkitLibDir,
  resolvePlanningContext,
};
