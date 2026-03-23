#!/usr/bin/env node
/**
 * Jira Delete Under Root: delete all work items under a capability root (Epics, Stories,
 * Sub-tasks, Action Items) while leaving the root and action-item root themselves.
 *
 * Uses the same Jira REST API and env as jira-export-pa.js. Deletes in order: Sub-tasks,
 * Stories, Epics, Action Items so parent/child constraints are respected.
 *
 * Usage:
 *   node Scripts/jira-delete-under-root.js VI              # WSA-508 tree + WSA-509 action items
 *   node Scripts/jira-delete-under-root.js VI WSA-508      # explicit root
 *   node Scripts/jira-delete-under-root.js VI WSA-508 WSA-509
 *   node Scripts/jira-delete-under-root.js VI --dry-run     # list only, no deletions
 *   node Scripts/jira-delete-under-root.js WSA-121 [actionItemRoot] [--delete-root]
 *   node Scripts/jira-delete-under-root.js WSA-121 --delete-root   # delete root and entire tree
 *
 * With --delete-root: after deleting all children, the root issue itself is deleted.
 * Requires: JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN (e.g. in .cursor/.env).
 */

const path = require('path');
const https = require('https');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const MAX_RESULTS = 100;

const CAPABILITY_CONFIG = {
  PA: { prefix: 'PA', rootKey: 'WSA-2656', actionItemRoot: 'WSA-2657' },
  VI: { prefix: 'VI', rootKey: 'WSA-508', actionItemRoot: 'WSA-509' },
  WM: { prefix: 'WM', rootKey: 'WSA-2881', actionItemRoot: 'WSA-2882' },
};

/** Match Jira issue key (e.g. WSA-121, PROJ-1234). */
const ISSUE_KEY_REGEX = /^[A-Z][A-Z0-9]+-\d+$/i;

function parseArgs() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const deleteRoot = argv.includes('--delete-root');
  const rest = argv.filter((a) => a !== '--dry-run' && a !== '--delete-root');
  const first = rest[0];
  // Arbitrary root: first arg is an issue key (e.g. WSA-121)
  if (first && ISSUE_KEY_REGEX.test(first)) {
    return {
      rootKey: first,
      actionItemRoot: rest[1] && ISSUE_KEY_REGEX.test(rest[1]) ? rest[1] : null,
      dryRun,
      deleteRoot,
    };
  }
  const capability = (first || 'PA').toUpperCase();
  const config = CAPABILITY_CONFIG[capability];
  if (!config) {
    console.error('Unknown capability:', capability, '- known:', Object.keys(CAPABILITY_CONFIG).join(', '), 'or pass an issue key (e.g. WSA-121)');
    process.exit(1);
  }
  return {
    rootKey: rest[1] || config.rootKey,
    actionItemRoot: rest[2] || config.actionItemRoot,
    dryRun,
    deleteRoot,
  };
}

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
            resolve(res.statusCode === 204 ? null : JSON.parse(body));
          } catch (e) {
            resolve(null);
          }
        });
      }
    );
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

/** Search JQL; returns all issues (paginated). Uses v3 POST /rest/api/3/search/jql. */
async function searchJqlAll(jql, maxResults = MAX_RESULTS) {
  const base = (process.env.JIRA_URL || '').replace(/\/$/, '');
  const all = [];
  let nextPageToken = null;
  for (;;) {
    const body = JSON.stringify({ jql, maxResults, ...(nextPageToken && { nextPageToken }) });
    const data = await jiraRequest(base + '/rest/api/3/search/jql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    if (!data) break;
    const issues = data.values || data.issues || [];
    if (issues.length) {
      all.push(...issues);
      nextPageToken = data.nextPageToken || null;
      if (!nextPageToken) break;
    } else {
      break;
    }
  }
  return all;
}

/** DELETE /rest/api/3/issue/{issueIdOrKey} */
async function deleteIssue(baseUrl, issueIdOrKey) {
  const p = `/rest/api/3/issue/${encodeURIComponent(issueIdOrKey)}`;
  const url = baseUrl.replace(/\/$/, '') + p;
  return jiraRequest(url, { method: 'DELETE' });
}

async function run() {
  if (!process.env.JIRA_URL) loadEnvFromFile();
  if (!process.env.JIRA_URL || !process.env.JIRA_USERNAME || !process.env.JIRA_API_TOKEN) {
    console.error('Set JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN (e.g. from .cursor/.env).');
    process.exit(1);
  }

  const { rootKey, actionItemRoot, dryRun, deleteRoot } = parseArgs();
  const baseUrl = process.env.JIRA_URL.replace(/\/$/, '');

  console.log('Delete under root:', rootKey, actionItemRoot ? '| action-item root: ' + actionItemRoot : '', deleteRoot ? '| then delete root' : '', dryRun ? '(DRY RUN)' : '');

  // Collect all keys (same hierarchy as jira-export-pa.js)
  console.log('Fetching epics (parent =', rootKey + ')');
  let epics = await searchJqlAll(`parent = ${rootKey}`);
  const epicKeys = (epics.map((i) => i.key || i.id)).filter(Boolean);

  console.log('Fetching stories under', epicKeys.length, 'epics');
  let stories = [];
  for (const key of epicKeys) {
    const list = await searchJqlAll(`parent = ${key}`);
    stories.push(...list);
  }
  const storyKeys = stories.map((i) => i.key || i.id).filter(Boolean);

  console.log('Fetching subtasks under', storyKeys.length, 'stories');
  let subtasks = [];
  for (const key of storyKeys) {
    const list = await searchJqlAll(`parent = ${key}`);
    subtasks.push(...list);
  }

  let actionItems = [];
  if (actionItemRoot) {
    console.log('Fetching action items (parent =', actionItemRoot + ')');
    try {
      actionItems = await searchJqlAll(`parent = ${actionItemRoot}`);
    } catch (e) {
      if (!e.message || (!e.message.includes('404') && !e.message.includes('400'))) throw e;
      console.log('Action-item root not found or no access; skipping action items.');
    }
  }

  const subtaskKeys = subtasks.map((i) => i.key || i.id).filter(Boolean);
  const storyKeysList = stories.map((i) => i.key || i.id).filter(Boolean);
  const actionItemKeys = actionItems.map((i) => i.key || i.id).filter(Boolean);

  const toDelete = [
    { label: 'Sub-tasks', keys: subtaskKeys },
    { label: 'Stories', keys: storyKeysList },
    { label: 'Epics', keys: epicKeys },
    { label: 'Action items', keys: actionItemKeys },
  ];
  const total = toDelete.reduce((n, g) => n + g.keys.length, 0);

  console.log('Counts: Epics', epicKeys.length, '| Stories', storyKeysList.length, '| Sub-tasks', subtaskKeys.length, '| Action items', actionItemKeys.length, '| Total', total);
  if (total === 0 && !deleteRoot) {
    console.log('Nothing to delete.');
    return;
  }

  if (dryRun) {
    console.log('DRY RUN: would delete the above.');
    if (deleteRoot) console.log('DRY RUN: would then delete root', rootKey);
    console.log('Run without --dry-run to delete.');
    return;
  }

  // Delete in order: subtasks, stories, epics, action items
  for (const { label, keys } of toDelete) {
    for (const key of keys) {
      try {
        await deleteIssue(baseUrl, key);
        console.log('Deleted', key, label);
      } catch (e) {
        console.error('Failed to delete', key, e.message);
      }
    }
  }

  if (deleteRoot) {
    try {
      await deleteIssue(baseUrl, rootKey);
      console.log('Deleted root', rootKey);
    } catch (e) {
      console.error('Failed to delete root', rootKey, e.message);
    }
  }
  console.log('Done.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
