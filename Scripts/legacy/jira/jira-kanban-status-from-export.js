#!/usr/bin/env node
/**
 * Rebuild kanban Jira status JSON/JS from latest dated export — forwards to
 * `dynamo-plan jira kanban-rebuild PA` (no Jira API).
 *
 * Resolves CLI: DYNAMO_PLAN_CLI, or sibling dynamo-os/planning-toolkit/bin/cli.js.
 *
 * Usage: node Scripts/legacy/jira/jira-kanban-status-from-export.js [CAP]
 * Default CAP is PA (Pipeline Automation).
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

const cap = process.argv[2] || 'PA';
const result = spawnSync(
  process.execPath,
  [cli, 'jira', 'kanban-rebuild', cap, '--cwd', projectRoot],
  { stdio: 'inherit', env: process.env }
);

if (result.error) {
  console.error(result.error.message || result.error);
  process.exit(1);
}
process.exit(result.status === null ? 1 : result.status);
