#!/usr/bin/env node
/**
 * WBS Move Input to Archive — forwards to `dynamo-plan wbs archive-input`.
 *
 * Resolves CLI: DYNAMO_PLAN_CLI, or sibling dynamo-os/planning-toolkit/bin/cli.js.
 *
 * From project root: node Scripts/wbs-move-input-to-archive.js <capability> <dateStamp>
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const capability = process.argv[2];
const dateStamp = process.argv[3];
if (!capability || !dateStamp) {
  console.error('Usage: node Scripts/wbs-move-input-to-archive.js <capability> <dateStamp>');
  console.error('Example: node Scripts/wbs-move-input-to-archive.js PA 03-17-2026');
  console.error('Or: dynamo-plan wbs archive-input PA 03-17-2026');
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
  [cli, 'wbs', 'archive-input', capability, dateStamp, '--cwd', projectRoot],
  { stdio: 'inherit', env: process.env }
);

if (result.error) {
  console.error(result.error.message || result.error);
  process.exit(1);
}
process.exit(result.status === null ? 1 : result.status);
