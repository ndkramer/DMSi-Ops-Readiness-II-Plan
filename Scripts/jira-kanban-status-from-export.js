#!/usr/bin/env node
/**
 * Rebuild PA/Jira/pa-kanban-jira-status.json and pa-kanban-jira-status.js from the latest PA/Jira/PA-Jira-mm-dd-yyyy-json.json
 * without calling the Jira API. Use when you have a fresh export file but cannot re-hit the API.
 *
 * Usage: node Scripts/jira-kanban-status-from-export.js
 *
 * Optional: JIRA_URL in .cursor/.env sets jira_base_url for browse links (default https://godynamo.atlassian.net).
 */

const fs = require('fs');
const path = require('path');
const { buildKanbanJiraStatusJson, writeKanbanStatusArtifacts } = require('./jira-export-pa.js');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const JIRA_DIR = path.join(PROJECT_ROOT, 'PA', 'Jira');

function loadEnvFromFile() {
  const envPath = path.join(PROJECT_ROOT, '.cursor', '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) {
      const val = m[2].replace(/^["']|["']$/g, '').trim();
      process.env[m[1]] = val;
    }
  }
}

function main() {
  loadEnvFromFile();
  if (!fs.existsSync(JIRA_DIR)) {
    console.error('Missing directory:', JIRA_DIR);
    process.exit(1);
  }
  const files = fs
    .readdirSync(JIRA_DIR)
    .filter((f) => /^PA-Jira-\d{2}-\d{2}-\d{4}-json\.json$/.test(f));
  if (!files.length) {
    console.error('No PA-Jira-*-json.json found in PA/Jira');
    process.exit(1);
  }
  files.sort();
  const latest = files[files.length - 1];
  const data = JSON.parse(fs.readFileSync(path.join(JIRA_DIR, latest), 'utf8'));
  const baseUrl = (process.env.JIRA_URL || 'https://godynamo.atlassian.net').replace(/\/$/, '');
  const payload = buildKanbanJiraStatusJson(data.stories || [], baseUrl);
  payload.export_note = `Rebuilt from ${latest} (no live Jira call). For live data run: node Scripts/jira-export-pa.js`;
  writeKanbanStatusArtifacts(JIRA_DIR, payload);
  console.log('Wrote', path.join(JIRA_DIR, 'pa-kanban-jira-status.json'), 'and', path.join(JIRA_DIR, 'pa-kanban-jira-status.js'));
}

main();
