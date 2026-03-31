#!/usr/bin/env node
/**
 * WBS Load Prep — forwards to dynamo-os planning toolkit (`dynamo-plan wbs prep`).
 *
 * Resolves CLI in order:
 * 1. DYNAMO_PLAN_CLI — absolute path to planning-toolkit/bin/cli.js
 * 2. Sibling repo: <this-repo-parent>/dynamo-os/planning-toolkit/bin/cli.js
 *
 * From project root: node Scripts/wbs-load-prep.js <capability>
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const capability = process.argv[2];
if (!capability) {
  console.error('Usage: node Scripts/wbs-load-prep.js <capability>');
  console.error('Example: node Scripts/wbs-load-prep.js PA');
  console.error('Or: dynamo-plan wbs prep PA');
  process.exit(1);
}

const projectRoot = path.resolve(__dirname, '..');

function resolveCliPath() {
  const env = process.env.DYNAMO_PLAN_CLI;
  if (env && fs.existsSync(env)) return path.resolve(env);
  const sibling = path.join(projectRoot, '..', 'dynamo-os', 'planning-toolkit', 'bin', 'cli.js');
  if (fs.existsSync(sibling)) return sibling;
  return null;
}

const cli = resolveCliPath();
if (!cli) {
  console.error(
    'Could not find dynamo-plan CLI. Install sibling repo dynamo-os next to this project, or set DYNAMO_PLAN_CLI to planning-toolkit/bin/cli.js'
  );
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [cli, 'wbs', 'prep', capability, '--cwd', projectRoot],
  { stdio: 'inherit', env: process.env }
);

if (result.error) {
  console.error(result.error.message || result.error);
  process.exit(1);
}

process.exit(result.status === null ? 1 : result.status);
