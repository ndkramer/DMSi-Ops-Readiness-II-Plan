#!/usr/bin/env node
/**
 * Jira export — forwards to `dynamo-plan jira export`.
 *
 * Resolves CLI: DYNAMO_PLAN_CLI, or sibling dynamo-os/planning-toolkit/bin/cli.js.
 *
 * Usage (from project root):
 *   node Scripts/legacy/jira/jira-export-pa.js [capability] [rootKey] [actionItemRoot]
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '../../..');

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

const extra = process.argv.slice(2);
const result = spawnSync(
  process.execPath,
  [cli, 'jira', 'export', ...extra, '--cwd', projectRoot],
  { stdio: 'inherit', env: process.env }
);

if (result.error) {
  console.error(result.error.message || result.error);
  process.exit(1);
}
process.exit(result.status === null ? 1 : result.status);
