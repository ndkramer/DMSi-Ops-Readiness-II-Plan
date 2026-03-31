#!/usr/bin/env node
/**
 * Jira export for Customer Support (WB): reads keys from WSB-WSC/WB/wb-outcomes.json
 * and invokes the shared exporter (jira-export-pa.js) with capability WB.
 *
 * Prerequisite: wb-outcomes.json must have non-null jira.capability_issue_key and jira.action_items_epic_key.
 *
 * Usage (from project root):
 *   node Scripts/jira-export-wb.js
 *
 * Alternative (explicit keys):
 *   node Scripts/jira-export-pa.js WB <WSA-capability> <WSA-action-items-epic>
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { resolvePlanningContext, PROJECT_ROOT } = require('./planning-path-context');

const ctx = resolvePlanningContext();
const wbDir = ctx ? ctx.getCapabilityFolder('WB') : require('./wbs-capability-folder').getCapabilityFolder('WB');
const registryPath = path.join(wbDir, 'wb-outcomes.json');

function resolveCliPath() {
  const env = process.env.DYNAMO_PLAN_CLI;
  if (env && fs.existsSync(env)) return path.resolve(env);
  const sibling = path.join(PROJECT_ROOT, '..', 'dynamo-os', 'planning-toolkit', 'bin', 'cli.js');
  if (fs.existsSync(sibling)) return sibling;
  return null;
}

function main() {
  if (!fs.existsSync(registryPath)) {
    console.error('Missing', registryPath);
    process.exit(1);
  }
  const reg = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const cap = reg.jira && reg.jira.capability_issue_key;
  const act = reg.jira && reg.jira.action_items_epic_key;
  if (!cap || !act) {
    console.error(
      'WB Jira export: set jira.capability_issue_key and jira.action_items_epic_key in WSB-WSC/WB/wb-outcomes.json, then re-run.\n' +
        'Or run: dynamo-plan jira export WB <capabilityKey> <actionEpicKey>'
    );
    process.exit(1);
  }
  const cli = resolveCliPath();
  if (!cli) {
    console.error(
      'Could not find dynamo-plan CLI. Set DYNAMO_PLAN_CLI or install sibling dynamo-os/planning-toolkit.'
    );
    process.exit(1);
  }
  const r = spawnSync(
    process.execPath,
    [cli, 'jira', 'export', 'WB', cap, act, '--cwd', PROJECT_ROOT],
    { stdio: 'inherit', env: process.env }
  );
  process.exit(r.status === null ? 1 : r.status);
}

main();
