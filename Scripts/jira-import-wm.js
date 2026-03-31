#!/usr/bin/env node
/**
 * Thin wrapper: forwards to dynamo-os planning-toolkit `jira import-wm`.
 * Creates WM issues from `{filePrefix}-WBS-Jira-Import.json` under capabilities.WM (see dynamo-os.config.cjs).
 *
 * Usage: node Scripts/jira-import-wm.js [--dry-run]
 *    or: node Scripts/jira-import-wm.js <jsonPath> [rootKey] [actionItemRootKey] [--dry-run]
 *    or: node Scripts/jira-import-wm.js <rootKey> [actionItemRootKey] [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');

function resolveCliPath() {
  const env = process.env.DYNAMO_PLAN_CLI;
  if (env && fs.existsSync(env)) return path.resolve(env);
  const sibling = path.join(PROJECT_ROOT, '..', 'dynamo-os', 'planning-toolkit', 'bin', 'cli.js');
  if (fs.existsSync(sibling)) return sibling;
  return null;
}

function main() {
  const cli = resolveCliPath();
  if (!cli) {
    console.error(
      'Could not find dynamo-plan CLI. Set DYNAMO_PLAN_CLI or install sibling dynamo-os/planning-toolkit.'
    );
    process.exit(1);
  }
  const args = process.argv.slice(2);
  const r = spawnSync(
    process.execPath,
    [cli, 'jira', 'import-wm', ...args, '--cwd', PROJECT_ROOT],
    { stdio: 'inherit', env: process.env }
  );
  process.exit(r.status === null ? 1 : r.status);
}

main();
