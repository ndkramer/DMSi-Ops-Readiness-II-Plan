/**
 * Resolve on-disk folder for WBS / Jira scripts. WB lives under WSB-WSC/WB (not repo-root WB/).
 */
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

function getCapabilityFolder(capability) {
  const c = String(capability || '').toUpperCase();
  if (c === 'WB') return path.join(PROJECT_ROOT, 'WSB-WSC', 'WB');
  return path.join(PROJECT_ROOT, c);
}

/** Path segments for logs and markdown (e.g. WBS-Load report). */
function capabilityFolderDisplay(capability) {
  const c = String(capability || '').toUpperCase();
  return c === 'WB' ? 'WSB-WSC/WB' : c;
}

module.exports = { getCapabilityFolder, capabilityFolderDisplay, PROJECT_ROOT };
