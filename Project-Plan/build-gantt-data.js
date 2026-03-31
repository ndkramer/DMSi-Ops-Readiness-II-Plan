#!/usr/bin/env node
/**
 * Build Gantt data — forwards to `dynamo-plan gantt build`.
 *
 * Resolves CLI: DYNAMO_PLAN_CLI, or sibling dynamo-os/planning-toolkit/bin/cli.js.
 *
 * Usage (from repo root): node Project-Plan/build-gantt-data.js [--inline]
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

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

const extra = process.argv.slice(2).filter((a) => a === '--inline');
const result = spawnSync(
  process.execPath,
  [cli, 'gantt', 'build', '--cwd', projectRoot, ...extra],
  { stdio: 'inherit', env: process.env }
);

if (result.error) {
  console.error(result.error.message || result.error);
  process.exit(1);
}
process.exit(result.status === null ? 1 : result.status);
