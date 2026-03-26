/**
 * Resolve on-disk folder for WBS / Jira scripts.
 * PA, VI, WM live under WSA/; WB under WSB-WSC/WB.
 */
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

const WSA_CAPS = new Set(['PA', 'VI', 'WM']);

function getCapabilityFolder(capability) {
  const c = String(capability || '').toUpperCase();
  if (c === 'WB') return path.join(PROJECT_ROOT, 'WSB-WSC', 'WB');
  if (WSA_CAPS.has(c)) return path.join(PROJECT_ROOT, 'WSA', c);
  return path.join(PROJECT_ROOT, c);
}

/** Path segments for logs and markdown (e.g. WBS-Load report). */
function capabilityFolderDisplay(capability) {
  const c = String(capability || '').toUpperCase();
  if (c === 'WB') return 'WSB-WSC/WB';
  if (WSA_CAPS.has(c)) return `WSA/${c}`;
  return c;
}

module.exports = { getCapabilityFolder, capabilityFolderDisplay, PROJECT_ROOT };
