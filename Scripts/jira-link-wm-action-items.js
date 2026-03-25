#!/usr/bin/env node
/**
 * Link existing WM action items (risks/decisions) to their related work items in Jira.
 * Uses WM/Output/WM-WBS-Jira-Import.json: each action item has related_outcome (Epic)
 * and optionally required_by (Story). Creates "Relates to" links from action item -> Epic/Story.
 *
 * Use this after a WM import when action items were created but not linked to Epics/Stories.
 * Key ranges default to the 2026-03-17 import run (Epics WSA-2882..2890, Stories 2891..2923,
 * Action items 3049..3074). Override with --epic-start, --story-start, --action-start if needed.
 *
 * Usage:
 *   node Scripts/jira-link-wm-action-items.js
 *   node Scripts/jira-link-wm-action-items.js --dry-run
 *   node Scripts/jira-link-wm-action-items.js --epic-start 2882 --story-start 2891 --action-start 3049
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const IMPORT_JSON = path.join(PROJECT_ROOT, 'WM', 'Output', 'WM-WBS-Jira-Import.json');
const DELAY_MS = 200;

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

function jiraRequest(urlPath, opts = {}) {
  const base = process.env.JIRA_URL || '';
  const u = new URL(urlPath.startsWith('http') ? urlPath : base.replace(/\/$/, '') + urlPath);
  const username = process.env.JIRA_USERNAME || '';
  const token = process.env.JIRA_API_TOKEN || '';
  const auth = Buffer.from(`${username}:${token}`).toString('base64');

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: opts.method || 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
          ...opts.headers,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (ch) => (body += ch));
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`Jira ${res.statusCode}: ${body}`));
            return;
          }
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch (e) {
            reject(new Error(`Invalid JSON: ${body.slice(0, 200)}`));
          }
        });
      }
    );
    req.on('error', reject);
    if (opts.body) req.write(typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body));
    req.end();
  });
}

/** Get issue link type name from Jira (or use JIRA_ISSUE_LINK_TYPE if set). */
async function getIssueLinkTypeName(baseUrl) {
  if (process.env.JIRA_ISSUE_LINK_TYPE) return process.env.JIRA_ISSUE_LINK_TYPE;
  const data = await jiraRequest(baseUrl + '/rest/api/3/issueLinkType');
  const types = data.issueLinkTypes || data.values || [];
  if (!types.length) throw new Error('No issue link types found. Set JIRA_ISSUE_LINK_TYPE in .cursor/.env to your link type name.');
  const prefer = ['Relates to', 'Related to', 'relates to', 'Duplicate', 'Blocks', 'is duplicated by'];
  for (const p of prefer) {
    const t = types.find((x) => x.name && x.name.toLowerCase() === p.toLowerCase());
    if (t) return t.name;
  }
  return types[0].name;
}

async function createIssueLink(baseUrl, linkTypeName, inwardKey, outwardKey, dryRun) {
  if (dryRun) {
    console.log('[dry-run] LINK', linkTypeName, outwardKey, '->', inwardKey);
    return;
  }
  const body = {
    type: { name: linkTypeName },
    inwardIssue: { key: inwardKey },
    outwardIssue: { key: outwardKey },
  };
  await jiraRequest(baseUrl + '/rest/api/3/issueLink', { method: 'POST', body });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  let epicStart = 2882, storyStart = 2891, actionStart = 3049;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--epic-start' && args[i + 1]) { epicStart = parseInt(args[i + 1], 10); i++; }
    else if (args[i] === '--story-start' && args[i + 1]) { storyStart = parseInt(args[i + 1], 10); i++; }
    else if (args[i] === '--action-start' && args[i + 1]) { actionStart = parseInt(args[i + 1], 10); i++; }
  }
  return { dryRun, epicStart, storyStart, actionStart };
}

async function main() {
  const { dryRun, epicStart, storyStart, actionStart } = parseArgs();
  loadEnvFromFile();

  const baseUrl = (process.env.JIRA_URL || '').replace(/\/$/, '');
  if (!baseUrl || !process.env.JIRA_USERNAME || !process.env.JIRA_API_TOKEN) {
    console.error('Set JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN (e.g. in .cursor/.env)');
    process.exit(1);
  }

  if (!fs.existsSync(IMPORT_JSON)) {
    console.error('Missing:', IMPORT_JSON);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(IMPORT_JSON, 'utf8'));
  const rootKey = data.metadata.root_key; // WSA-2881
  const projectKey = rootKey.replace(/-.*$/, ''); // WSA
  const workItems = data.work_items || [];
  const actionItems = data.action_items || [];

  const epics = workItems.filter((w) => w.issue_type === 'Epic');
  const stories = workItems.filter((w) => w.issue_type === 'Story');
  const outcomeIdToKey = {};
  epics.forEach((w, i) => {
    if (w.outcome_id) outcomeIdToKey[w.outcome_id] = `${projectKey}-${epicStart + i}`;
  });
  stories.forEach((w, i) => {
    if (w.outcome_id) outcomeIdToKey[w.outcome_id] = `${projectKey}-${storyStart + i}`;
  });

  const linkTypeName = await getIssueLinkTypeName(baseUrl);
  console.log('Using issue link type:', linkTypeName);
  console.log('Linking', actionItems.length, 'action items to related Epics/Stories (', Object.keys(outcomeIdToKey).length, 'outcome keys). Key ranges: Epics', epicStart, '-', epicStart + epics.length - 1, ', Stories', storyStart, '-', storyStart + stories.length - 1, ', Actions', actionStart, '-', actionStart + actionItems.length - 1);
  if (dryRun) console.log('DRY RUN\n');

  for (let i = 0; i < actionItems.length; i++) {
    const a = actionItems[i];
    const actionKey = `${projectKey}-${actionStart + i}`;
    const linked = new Set();

    if (a.related_outcome && outcomeIdToKey[a.related_outcome]) {
      try {
        await createIssueLink(baseUrl, linkTypeName, outcomeIdToKey[a.related_outcome], actionKey, dryRun);
        linked.add(a.related_outcome);
        if (!dryRun) console.log('Link', actionKey, '->', outcomeIdToKey[a.related_outcome], '(' + a.related_outcome + ')');
      } catch (e) {
        console.warn('Link failed', actionKey, '->', a.related_outcome, e.message);
      }
      await sleep(DELAY_MS);
    }

    if (a.required_by && outcomeIdToKey[a.required_by] && !linked.has(a.required_by)) {
      try {
        await createIssueLink(baseUrl, linkTypeName, outcomeIdToKey[a.required_by], actionKey, dryRun);
        if (!dryRun) console.log('Link', actionKey, '->', outcomeIdToKey[a.required_by], '(' + a.required_by + ')');
      } catch (e) {
        console.warn('Link failed', actionKey, '->', a.required_by, e.message);
      }
      await sleep(DELAY_MS);
    }
    // If no clear parent, assign to capability root (WSA-2881)
    if (linked.size === 0) {
      try {
        await createIssueLink(baseUrl, linkTypeName, rootKey, actionKey, dryRun);
        if (!dryRun) console.log('Link (no parent)', actionKey, '->', rootKey);
      } catch (e) {
        console.warn('Link to capability root failed', actionKey, '->', rootKey, e.message);
      }
      await sleep(DELAY_MS);
    } else {
      // Always link to capability root so action items appear when viewing WSA-2881
      try {
        await createIssueLink(baseUrl, linkTypeName, rootKey, actionKey, dryRun);
        if (!dryRun) console.log('Link', actionKey, '->', rootKey, '(capability)');
      } catch (e) {
        console.warn('Link to capability root failed', actionKey, '->', rootKey, e.message);
      }
      await sleep(DELAY_MS);
    }
  }

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
