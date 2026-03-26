#!/usr/bin/env node
/**
 * Jira Import: create Epics, Stories, Sub-tasks, and Action Items from
 * WSA/WM/Output/WM-WBS-Jira-Import.json under the WM capability root (WSA-2881).
 *
 * Uses Jira REST API v3. Requires JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN in
 * process.env or .cursor/.env. Run from project root.
 * Optional: JIRA_ISSUE_LINK_TYPE (e.g. "Duplicate" or "Relates to") for action-item links;
 * if unset, the script discovers an available link type from the Jira API.
 *
 * Import order: Epics (parent WSA-2881) -> Stories (parent Epic key) ->
 * Sub-tasks (parent Story key) -> Action Items. Each action item is linked to its
 * related_outcome (Epic) and required_by (Story) so risks/decisions appear on the right work.
 *
 * Usage:
 *   node Scripts/jira-import-wm.js                        # default import JSON under WSA-2881
 *   node Scripts/jira-import-wm.js --dry-run              # log only, no API calls
 *   node Scripts/jira-import-wm.js <jsonPath> [rootKey] [actionItemRootKey]
 *   node Scripts/jira-import-wm.js WSA/WM/Output/Archive/WM-WBS-Jira-Import.json WSA-508 WSA-509
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const { getCapabilityFolder } = require('./wbs-capability-folder');
const DEFAULT_IMPORT_JSON = path.join(getCapabilityFolder('WM'), 'Output', 'WM-WBS-Jira-Import.json');
const DELAY_MS = 250;

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

/** Plain text to Atlassian Document Format (single paragraph). */
function textToAdf(text) {
  if (text == null || String(text).trim() === '') return undefined;
  const t = String(text).trim();
  return {
    type: 'doc',
    version: 1,
    content: [{ type: 'paragraph', content: [{ type: 'text', text: t }] }],
  };
}

/**
 * Create a Jira issue. Returns { key, id }.
 * @param {object} opts - { projectKey, issuetype, summary, description?, parentKey?, labels?, priority? }
 */
async function createIssue(baseUrl, opts, dryRun) {
  const fields = {
    project: { key: opts.projectKey },
    issuetype: { name: opts.issuetype },
    summary: opts.summary,
  };
  if (opts.description != null && opts.description !== '') {
    const adf = textToAdf(opts.description);
    if (adf) fields.description = adf;
  }
  if (opts.parentKey) fields.parent = { key: opts.parentKey };
  if (opts.labels && opts.labels.length) fields.labels = opts.labels;
  if (opts.priority) fields.priority = { name: opts.priority };

  const body = { fields };
  if (dryRun) {
    console.log('[dry-run] CREATE', opts.issuetype, opts.summary.slice(0, 50) + (opts.summary.length > 50 ? '...' : ''), opts.parentKey ? `parent=${opts.parentKey}` : '');
    return { key: 'DRY-KEY', id: '0' };
  }
  const res = await jiraRequest(baseUrl + '/rest/api/3/issue', { method: 'POST', body });
  return { key: res.key, id: res.id };
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

/**
 * Create an issue link between two issues.
 * @param {string} linkType - e.g. "Relates to" or use getIssueLinkTypeName() for your instance
 * @param {string} inwardKey - key of the issue that receives the "inward" link description
 * @param {string} outwardKey - key of the issue that receives the "outward" link description
 */
async function createIssueLink(baseUrl, linkType, inwardKey, outwardKey, dryRun) {
  if (dryRun) {
    console.log('[dry-run] LINK', linkType, outwardKey, '->', inwardKey);
    return;
  }
  const body = {
    type: { name: linkType },
    inwardIssue: { key: inwardKey },
    outwardIssue: { key: outwardKey },
  };
  await jiraRequest(baseUrl + '/rest/api/3/issueLink', { method: 'POST', body });
}

/** Jira labels cannot contain spaces; replace with hyphen. */
function sanitizeLabels(labels) {
  if (!labels || !labels.length) return labels;
  return labels.map((s) => String(s).trim().replace(/\s+/g, '-')).filter(Boolean);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseArgs() {
  const argv = process.argv.slice(2).filter((a) => a !== '--dry-run');
  const dryRun = process.argv.includes('--dry-run');
  let importPath = DEFAULT_IMPORT_JSON;
  let rootKeyOverride = null;
  let actionItemRootOverride = null;
  if (argv.length >= 1 && !argv[0].startsWith('WSA-')) {
    importPath = path.isAbsolute(argv[0]) ? argv[0] : path.join(PROJECT_ROOT, argv[0]);
    if (argv.length >= 2) rootKeyOverride = argv[1];
    if (argv.length >= 3) actionItemRootOverride = argv[2];
  } else if (argv.length >= 1) {
    rootKeyOverride = argv[0];
    if (argv.length >= 2) actionItemRootOverride = argv[1];
  }
  return { importPath, rootKeyOverride, actionItemRootOverride, dryRun };
}

async function main() {
  const { importPath, rootKeyOverride, actionItemRootOverride, dryRun } = parseArgs();
  loadEnvFromFile();

  const baseUrl = (process.env.JIRA_URL || '').replace(/\/$/, '');
  if (!baseUrl || !process.env.JIRA_USERNAME || !process.env.JIRA_API_TOKEN) {
    console.error('Set JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN (e.g. in .cursor/.env)');
    process.exit(1);
  }

  if (!fs.existsSync(importPath)) {
    console.error('Missing:', importPath);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(importPath, 'utf8'));
  const rootKey = rootKeyOverride || data.metadata.root_key;
  const actionItemRootKey = actionItemRootOverride != null ? actionItemRootOverride : data.metadata.action_item_root_key;
  const projectKey = rootKey.replace(/-.*$/, ''); // e.g. WSA

  const workItems = data.work_items || [];
  const actionItems = data.action_items || [];

  const summaryToKey = {};   // parent summary -> Jira key (for resolving parent)
  const outcomeIdToKey = {}; // outcome_id (WM-OC-01, WM-OC-01.1, etc.) -> Jira key (for action-item links)

  console.log('Importing under', rootKey, '| Project', projectKey, '| Epics+Stories+Sub-tasks:', workItems.length, '| Action items:', actionItems.length);
  if (dryRun) console.log('DRY RUN - no API writes\n');

  // 1) Epics (parent = rootKey)
  const epics = workItems.filter((w) => w.issue_type === 'Epic');
  for (const w of epics) {
    const res = await createIssue(baseUrl, {
      projectKey,
      issuetype: 'Epic',
      summary: w.summary,
      description: w.description,
      parentKey: rootKey,
      labels: sanitizeLabels(w.labels ? w.labels.split(',').map((s) => s.trim()).filter(Boolean) : []),
      priority: w.priority || 'Medium',
    }, dryRun);
    summaryToKey[w.summary] = res.key;
    if (w.outcome_id) outcomeIdToKey[w.outcome_id] = res.key;
    if (!dryRun) console.log('Epic', res.key, w.summary.slice(0, 60));
    await sleep(DELAY_MS);
  }

  // 2) Stories (parent = Epic summary)
  const stories = workItems.filter((w) => w.issue_type === 'Story');
  for (const w of stories) {
    const parentKey = summaryToKey[w.parent];
    if (!parentKey && w.parent !== rootKey) {
      console.warn('Story parent not found:', w.parent, '; using root', rootKey);
    }
    const res = await createIssue(baseUrl, {
      projectKey,
      issuetype: 'Story',
      summary: w.summary,
      description: w.description,
      parentKey: parentKey || rootKey,
      labels: sanitizeLabels(w.labels ? w.labels.split(',').map((s) => s.trim()).filter(Boolean) : []),
      priority: w.priority || 'Medium',
    }, dryRun);
    summaryToKey[w.summary] = res.key;
    if (w.outcome_id) outcomeIdToKey[w.outcome_id] = res.key;
    if (!dryRun) console.log('Story', res.key, w.summary.slice(0, 60));
    await sleep(DELAY_MS);
  }

  // 3) Sub-tasks (parent = Story summary)
  const subtasks = workItems.filter((w) => w.issue_type === 'Sub-task');
  for (const w of subtasks) {
    const parentKey = summaryToKey[w.parent];
    if (!parentKey) {
      console.warn('Sub-task parent not found:', w.parent);
      continue;
    }
    const res = await createIssue(baseUrl, {
      projectKey,
      issuetype: 'Sub-task',
      summary: w.summary,
      description: w.description,
      parentKey,
      labels: sanitizeLabels(w.labels ? w.labels.split(',').map((s) => s.trim()).filter(Boolean) : []),
      priority: w.priority || 'Medium',
    }, dryRun);
    if (!dryRun) console.log('Sub-task', res.key, w.summary.slice(0, 50));
    await sleep(DELAY_MS);
  }

  // 4) Action Items: create issue, then link to related work (Epic/Story) and capability root
  const linkTypeName = await getIssueLinkTypeName(baseUrl);
  if (!dryRun) console.log('Using issue link type:', linkTypeName);
  for (const a of actionItems) {
    const res = await createIssue(baseUrl, {
      projectKey,
      issuetype: a.issue_type || 'Action Item',
      summary: a.summary,
      description: a.description,
      parentKey: undefined,
      labels: sanitizeLabels(a.labels ? (Array.isArray(a.labels) ? a.labels : a.labels.split(',').map((s) => s.trim()).filter(Boolean)) : []),
      priority: a.priority || 'Medium',
    }, dryRun);
    if (!dryRun) {
      console.log('Action', res.key, a.summary.slice(0, 50));
      const linked = new Set();
      // Link to related outcome (Epic) so the risk/decision appears on that Epic
      if (a.related_outcome && outcomeIdToKey[a.related_outcome]) {
        try {
          await createIssueLink(baseUrl, linkTypeName, outcomeIdToKey[a.related_outcome], res.key, dryRun);
          linked.add(a.related_outcome);
        } catch (e) {
          console.warn('Link failed', res.key, '->', outcomeIdToKey[a.related_outcome], e.message);
        }
        await sleep(DELAY_MS);
      }
      // Link to required_by (Story) when different from Epic, e.g. decision required by WM-OC-02.4
      if (a.required_by && outcomeIdToKey[a.required_by] && !linked.has(a.required_by)) {
        try {
          await createIssueLink(baseUrl, linkTypeName, outcomeIdToKey[a.required_by], res.key, dryRun);
        } catch (e) {
          console.warn('Link failed', res.key, '->', outcomeIdToKey[a.required_by], e.message);
        }
        await sleep(DELAY_MS);
      }
      // If no clear parent (no related_outcome or required_by linked), assign to capability root
      if (linked.size === 0) {
        try {
          await createIssueLink(baseUrl, linkTypeName, rootKey, res.key, dryRun);
          if (!dryRun) console.log('Link (no parent)', res.key, '->', rootKey);
        } catch (e) {
          console.warn('Link to capability root failed', res.key, '->', rootKey, e.message);
        }
        await sleep(DELAY_MS);
      } else {
        // Always link to capability root (WSA-2881) so action items appear when viewing the capability
        try {
          await createIssueLink(baseUrl, linkTypeName, rootKey, res.key, dryRun);
        } catch (e) {
          console.warn('Link to capability root failed', res.key, '->', rootKey, e.message);
        }
        await sleep(DELAY_MS);
      }
      // Optionally link to action-item root for grouping (skip if root key is same as an Epic we created)
      if (actionItemRootKey && actionItemRootKey !== rootKey) {
        try {
          await createIssueLink(baseUrl, linkTypeName, actionItemRootKey, res.key, dryRun);
        } catch (e) {
          console.warn('Link to action root failed', res.key, '->', actionItemRootKey, e.message);
        }
        await sleep(DELAY_MS);
      }
    }
    await sleep(DELAY_MS);
  }

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
