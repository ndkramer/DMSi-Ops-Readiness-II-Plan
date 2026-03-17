#!/usr/bin/env node
/**
 * Jira Export: export a capability's full hierarchy from Jira (all children of the root) into
 * {Capability}/Jira/{Prefix}-Jira-mm-dd-yyyy-json.json. Includes Epics, Stories, Sub-tasks,
 * and Action Items (from the capability's action-item root).
 *
 * Uses Jira REST API v3. Requires JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN in process.env
 * (or .cursor/.env). Run from project root.
 *
 * Usage:
 *   node Scripts/jira-export-pa.js                    # PA, WSA-2656, WSA-2657
 *   node Scripts/jira-export-pa.js PA                # same
 *   node Scripts/jira-export-pa.js PA WSA-2656       # PA, custom root, default action root
 *   node Scripts/jira-export-pa.js PA WSA-2656 WSA-2657
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const MAX_RESULTS = 100;

/** Known capability roots. */
const CAPABILITY_CONFIG = {
  PA: { prefix: 'PA', rootKey: 'WSA-2656', actionItemRoot: 'WSA-2657' },
  VI: { prefix: 'VI', rootKey: 'WSA-508', actionItemRoot: 'WSA-509' },
  WM: { prefix: 'WM', rootKey: 'WSA-2881', actionItemRoot: 'WSA-2882' },
};

function parseArgs() {
  const argv = process.argv.slice(2);
  const capability = (argv[0] || 'PA').toUpperCase();
  const config = CAPABILITY_CONFIG[capability];
  if (!config) {
    console.error('Unknown capability:', capability, '- known:', Object.keys(CAPABILITY_CONFIG).join(', '));
    process.exit(1);
  }
  return {
    capability,
    prefix: config.prefix,
    rootKey: argv[1] || config.rootKey,
    actionItemRoot: argv[2] || config.actionItemRoot,
    outDir: path.join(PROJECT_ROOT, capability, 'Jira'),
    outFileName: (prefix) => `${prefix}-Jira-${getDateStamp()}-json.json`,
  };
}

function getDateStamp() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
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
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Invalid JSON: ${body.slice(0, 200)}`));
          }
        });
      }
    );
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

async function getIssue(baseUrl, keyOrId) {
  const path = `/rest/api/3/issue/${encodeURIComponent(keyOrId)}`;
  const url = baseUrl.replace(/\/$/, '') + path;
  return jiraRequest(url);
}

/** If search returned minimal issues (e.g. { id } only), fetch full issue for each. */
async function ensureFullIssues(baseUrl, issues) {
  const out = [];
  for (const issue of issues) {
    if (issue.fields != null && (issue.key || issue.id)) {
      out.push(issue);
    } else {
      const idOrKey = issue.key || issue.id;
      if (idOrKey) out.push(await getIssue(baseUrl, idOrKey));
    }
  }
  return out;
}

/**
 * Search using JQL; returns all issues (paginates). Tries v3 search/jql (POST) first, then legacy GET search.
 */
async function searchJqlAll(jql, maxResults = MAX_RESULTS) {
  const base = (process.env.JIRA_URL || '').replace(/\/$/, '');
  const all = [];
  let nextPageToken = null;

  const tryNewApi = async (token) => {
    const body = JSON.stringify({ jql, maxResults, ...(token && { nextPageToken: token }) });
    return jiraRequest(base + '/rest/api/3/search/jql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  };

  const tryLegacyApi = (startAt) => {
    const path = `/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&startAt=${startAt}`;
    return jiraRequest(base + path);
  };

  // Try legacy search first (returns full issue objects). If removed, use new search/jql (may return only { id }).
  let useLegacy = true;
  for (;;) {
    let data;
    if (!useLegacy) {
      try {
        data = await tryNewApi(nextPageToken);
      } catch (e) {
        if (e.message && (e.message.includes('404') || e.message.includes('410') || e.message.includes('removed'))) {
          useLegacy = true;
          data = await tryLegacyApi(all.length);
        } else {
          throw e;
        }
      }
    } else {
      try {
        data = await tryLegacyApi(all.length);
      } catch (e) {
        if (e.message && (e.message.includes('removed') || e.message.includes('410'))) {
          useLegacy = false;
          data = await tryNewApi(nextPageToken);
        } else {
          throw e;
        }
      }
    }

    if (data.values && data.values.length) {
      all.push(...data.values);
      nextPageToken = data.nextPageToken || null;
      if (!nextPageToken) break;
    } else if (data.issues && data.issues.length) {
      all.push(...data.issues);
      const total = data.total != null ? data.total : all.length;
      if (data.issues.length < maxResults || all.length >= total) break;
      nextPageToken = String((data.startAt || 0) + data.issues.length);
    } else {
      break;
    }
  }
  return all;
}

/** Extract plain text from Jira ADF description (object with content array) or return string. */
function descriptionToText(desc) {
  if (desc == null) return '';
  if (typeof desc === 'string') return desc;
  if (typeof desc !== 'object') return String(desc);
  const parts = [];
  function walk(node) {
    if (!node) return;
    if (node.text) parts.push(node.text);
    if (Array.isArray(node.content)) node.content.forEach(walk);
  }
  walk(desc);
  return parts.join(' ').trim();
}

/**
 * Flatten a raw Jira issue (key + fields) into the same shape as PA-WSB-Jira-Import:
 * issue_type, summary, description, parent, labels, owner, priority, outcome_id, category, target, status, component.
 * keyToSummary: optional map of issue key -> summary for resolving parent to summary.
 */
function flattenIssue(raw, issueTypeLabel, parentKey, keyToSummary = {}) {
  const key = raw.key || raw.id;
  const f = raw.fields || raw;
  const summary = f.summary != null ? String(f.summary) : '';
  const parent = parentKey != null ? (keyToSummary[parentKey] || parentKey) : '';
  const labels = Array.isArray(f.labels) ? f.labels.join(', ') : (f.labels != null ? String(f.labels) : '');
  const owner = f.assignee && (f.assignee.displayName || f.assignee.display) ? (f.assignee.displayName || f.assignee.display) : '';
  const priority = f.priority && f.priority.name ? f.priority.name : '';
  const status = f.status && f.status.name ? f.status.name : '';
  const component = Array.isArray(f.components) && f.components.length
    ? f.components.map((c) => c.name).join(', ')
    : (f.components && f.components.name ? f.components.name : '');
  let outcomeId = (summary.match(/\[(PA-[A-Z0-9.-]+)\]/) || summary.match(/\[(OC-[0-9.]+)\]/) || [])[1] || '';
  if (outcomeId && !outcomeId.startsWith('PA-')) outcomeId = 'PA-' + outcomeId;
  return {
    key,
    issue_type: issueTypeLabel,
    summary,
    description: descriptionToText(f.description),
    parent,
    labels,
    owner,
    priority,
    outcome_id: outcomeId,
    category: '',
    target: '',
    status,
    component,
  };
}

async function run() {
  if (!process.env.JIRA_URL) loadEnvFromFile();
  if (!process.env.JIRA_URL || !process.env.JIRA_USERNAME || !process.env.JIRA_API_TOKEN) {
    console.error('Set JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN (e.g. from .cursor/.env).');
    process.exit(1);
  }

  const { capability, prefix, rootKey, actionItemRoot, outDir, outFileName } = parseArgs();
  const baseUrl = process.env.JIRA_URL.replace(/\/$/, '');
  const outFile = path.join(outDir, outFileName(prefix));

  console.log('Exporting', capability, '| capability root', rootKey, '| action-item root', actionItemRoot);

  const capabilityIssue = await getIssue(baseUrl, rootKey);
  let actionItemRootIssue = null;
  try {
    actionItemRootIssue = await getIssue(baseUrl, actionItemRoot);
  } catch (e) {
    if (e.message && e.message.includes('404')) {
      console.log('Action-item root', actionItemRoot, 'not found or no access; skipping action items.');
    } else {
      throw e;
    }
  }

  console.log('Fetching epics (parent =', rootKey + ')');
  let epics = await searchJqlAll(`parent = ${rootKey}`);
  epics = await ensureFullIssues(baseUrl, epics);
  const epicKeys = (epics.map((i) => i.key || i.id)).filter(Boolean);

  console.log('Fetching stories under', epicKeys.length, 'epics');
  let stories = [];
  for (const key of epicKeys) {
    const list = await searchJqlAll(`parent = ${key}`);
    stories.push(...list);
  }
  stories = await ensureFullIssues(baseUrl, stories);
  const storyKeys = stories.map((i) => i.key || i.id).filter(Boolean);

  console.log('Fetching subtasks under', storyKeys.length, 'stories');
  let subtasks = [];
  for (const key of storyKeys) {
    const list = await searchJqlAll(`parent = ${key}`);
    subtasks.push(...list);
  }
  subtasks = await ensureFullIssues(baseUrl, subtasks);

  let actionItems = [];
  if (actionItemRootIssue) {
    console.log('Fetching action items (parent =', actionItemRoot + ')');
    actionItems = await searchJqlAll(`parent = ${actionItemRoot}`);
    actionItems = await ensureFullIssues(baseUrl, actionItems);
  }

  // Key -> summary for resolving parent to summary (same shape as PA-WSB-Jira-Import).
  const keyToSummary = {};
  epics.forEach((i) => {
    const k = i.key || i.id;
    if (k) keyToSummary[k] = (i.fields && i.fields.summary) || i.summary || k;
  });
  stories.forEach((i) => {
    const k = i.key || i.id;
    if (k) keyToSummary[k] = (i.fields && i.fields.summary) || i.summary || k;
  });

  const workItems = [];
  epics.forEach((raw) => {
    workItems.push(flattenIssue(raw, 'Epic', rootKey, keyToSummary));
  });
  stories.forEach((raw) => {
    const parentKey = (raw.fields && raw.fields.parent && raw.fields.parent.key) || raw.parent?.key;
    workItems.push(flattenIssue(raw, 'Story', parentKey, keyToSummary));
  });
  subtasks.forEach((raw) => {
    const parentKey = (raw.fields && raw.fields.parent && raw.fields.parent.key) || raw.parent?.key;
    workItems.push(flattenIssue(raw, 'Sub-task', parentKey, keyToSummary));
  });

  const actionItemsFlat = actionItems.map((raw) => {
    const flat = flattenIssue(raw, 'Action Item', actionItemRoot, keyToSummary);
    flat.link_to = actionItemRoot;
    flat.link_type = 'Related to';
    return flat;
  });

  const exportPayload = {
    metadata: {
      export_date: getDateStamp(),
      capability: capability,
      capability_root_key: rootKey,
      action_item_root_key: actionItemRoot,
      counts: {
        epics: epics.length,
        stories: stories.length,
        subtasks: subtasks.length,
        action_items: actionItems.length,
      },
    },
    capability: capabilityIssue,
    action_item_root: actionItemRootIssue,
    epics,
    stories,
    subtasks,
    action_items: actionItems,
    work_items: workItems,
    action_items_flat: actionItemsFlat,
  };

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(exportPayload, null, 2), 'utf8');
  console.log('Wrote', outFile);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
