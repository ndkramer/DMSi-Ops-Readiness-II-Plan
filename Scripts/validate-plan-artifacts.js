#!/usr/bin/env node
/**
 * Validates that key planning JSON files exist and parse as JSON.
 * Run after `npm run plan:validate` via `npm run validate`.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = [
  'Capability-map/capability-map-state.json',
  'Capability-map/capability-map-artifacts-dmsi.json',
  'WSA/PA/pa-outcomes.json',
  'WSB-WSC/wsb-wsc-outcome-dependencies.json',
  'Project-Plan/gantt-data.json',
];

let failed = false;
for (const rel of files) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.error(`validate-plan-artifacts: missing ${rel}`);
    failed = true;
    continue;
  }
  try {
    JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (e) {
    console.error(`validate-plan-artifacts: invalid JSON ${rel}: ${e.message}`);
    failed = true;
  }
}

if (!failed) {
  console.log('OK — JSON artifacts valid:', files.length, 'file(s)');
}
process.exit(failed ? 1 : 0);
