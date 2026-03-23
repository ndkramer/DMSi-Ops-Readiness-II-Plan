#!/usr/bin/env node
/**
 * Delete a Jira issue and everything under its tree: subtasks, issues with parent = key,
 * and inward/outward issue links (recursive closure). The root issue's **parent** (e.g. a
 * Capability/Epic) is **never** deleted and is skipped when issue links would reach it.
 *
 * Delete order: post-order on parent edges within the closure (excluding the root parent),
 * then the root issue last among its subtree.
 *
 * Usage:
 *   node Scripts/jira-delete-issue-tree.js WSA-3279 --dry-run
 *   node Scripts/jira-delete-issue-tree.js WSA-3279
 *   node Scripts/jira-delete-issue-tree.js WSA-3075 --dry-run --max-closure 500
 *   node Scripts/jira-delete-issue-tree.js WSA-3075 --count-only
 *
 * Large stories can have deep `parent = child` expansions; use --max-closure N to cap
 * discovery (or set JIRA_DELETE_MAX_CLOSURE). Omit for full tree (may take many minutes).
 *
 * Env: JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN (e.g. .cursor/.env). The Atlassian
 * account for the API token must have Browse Projects and Delete Issues on these keys.
 */

const path = require('path');
const https = require('https');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const MAX_RESULTS = 100;
/** Cap JQL pagination so a bad token loop or huge result set cannot hang forever. */
const MAX_JQL_PAGES = 500;
const REQUEST_TIMEOUT_MS = 60000;

/** Jira vars always come from .cursor/.env when present (overrides stale shell exports). */
const JIRA_ENV_KEYS = new Set(['JIRA_URL', 'JIRA_USERNAME', 'JIRA_API_TOKEN']);

function loadEnvFromFile() {
  const envPath = path.join(PROJECT_ROOT, '.cursor', '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    const val = m[2].replace(/^["']|["']$/g, '').trim();
    if (JIRA_ENV_KEYS.has(key)) {
      process.env[key] = val;
    } else if (!process.env[key]) {
      process.env[key] = val;
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
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error(`Jira request timeout after ${REQUEST_TIMEOUT_MS}ms`));
    });
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

async function searchJqlAll(jql, maxResults = MAX_RESULTS, maxPages = MAX_JQL_PAGES) {
  const base = (process.env.JIRA_URL || '').replace(/\/$/, '');
  const all = [];
  let nextPageToken = null;
  for (let page = 0; page < maxPages; page++) {
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

async function getIssueFields(issueKey) {
  const base = (process.env.JIRA_URL || '').replace(/\/$/, '');
  const q = new URLSearchParams({
    fields: 'parent,subtasks,issuelinks,summary',
  });
  return jiraRequest(`${base}/rest/api/3/issue/${encodeURIComponent(issueKey)}?${q}`);
}

/**
 * Collect all issue keys reachable from rootKey via parent=, subtasks, and issue links.
 * Skips JQL `parent = <rootParentKey>` so we do not load every issue under a Capability/Epic
 * when that parent is only the root's container (would hang on large hierarchies).
 */
async function collectClosure(rootKey, options = {}) {
  const maxClosure =
    options.maxClosure > 0
      ? options.maxClosure
      : parseInt(process.env.JIRA_DELETE_MAX_CLOSURE || '0', 10) || 0;
  const seen = new Set();
  const queue = [rootKey];
  let rootParentKey = null;
  let truncated = false;
  let _iter = 0;

  while (queue.length) {
    if (maxClosure > 0 && seen.size >= maxClosure) {
      truncated = true;
      break;
    }
    const key = queue.shift();
    if (seen.has(key)) continue;
    seen.add(key);
    _iter++;
    if (_iter % 250 === 0) {
      console.log('... scanning closure:', seen.size, 'issues so far');
    }
    if (process.env.DEBUG_JIRA_DELETE === '1') {
      console.error('[closure]', _iter, key, 'queue', queue.length, 'seen', seen.size, 'rootParent', rootParentKey || '-');
    }
    if (_iter > 100000) {
      throw new Error('collectClosure: exceeded 100000 iterations; use --max-closure to limit');
    }

    let raw;
    try {
      raw = await getIssueFields(key);
    } catch (e) {
      console.error('Skip (fetch failed):', key, e.message);
      continue;
    }

    const f = raw.fields || {};
    if (key === rootKey && f.parent && f.parent.key) {
      rootParentKey = f.parent.key;
    }
    // Do not walk up the parent chain here; the root's immediate parent is deleted last only.
    for (const st of f.subtasks || []) {
      if (st.key && !seen.has(st.key)) queue.push(st.key);
    }
    for (const block of f.issuelinks || []) {
      const inward = block.inwardIssue && block.inwardIssue.key;
      const outward = block.outwardIssue && block.outwardIssue.key;
      // Never follow links into the root's parent (e.g. Capability); we do not delete it.
      if (inward && inward !== rootParentKey && !seen.has(inward)) queue.push(inward);
      if (outward && outward !== rootParentKey && !seen.has(outward)) queue.push(outward);
    }

    let children = [];
    if (rootParentKey && key === rootParentKey) {
      // Avoid parent = Capability/Epic that would return thousands of unrelated issues.
    } else {
      try {
        children = await searchJqlAll(`parent = ${key}`);
      } catch (e) {
        console.error('JQL parent =', key, e.message);
      }
    }
    for (const ch of children) {
      const ck = ch.key || ch.id;
      if (ck && !seen.has(ck)) queue.push(ck);
    }
  }

  if (truncated) {
    console.warn(
      'WARNING: closure truncated at',
      maxClosure,
      'issues (use a higher --max-closure or omit for full tree).'
    );
  }
  return seen;
}

/**
 * Post-order list for keys in `subset` using only parent pointers where parent is also in `subset`.
 */
function postOrderByParent(others, parentOf) {
  const sub = new Set(others);
  const children = new Map();
  for (const k of sub) {
    const p = parentOf.get(k);
    if (p && sub.has(p)) {
      if (!children.has(p)) children.set(p, []);
      children.get(p).push(k);
    }
  }

  const visited = new Set();
  const out = [];

  function visit(k) {
    if (visited.has(k)) return;
    for (const c of children.get(k) || []) {
      visit(c);
    }
    visited.add(k);
    out.push(k);
  }

  const roots = [...sub].filter((k) => {
    const p = parentOf.get(k);
    return !p || !sub.has(p);
  });

  for (const r of roots) {
    visit(r);
  }
  return out;
}

function parseArgs() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const countOnly = argv.includes('--count-only');
  const rest = argv.filter((a) => a !== '--dry-run' && a !== '--count-only');
  let maxClosure = 0;
  const mcIdx = rest.indexOf('--max-closure');
  if (mcIdx !== -1 && rest[mcIdx + 1]) {
    maxClosure = parseInt(rest[mcIdx + 1], 10);
    if (Number.isNaN(maxClosure) || maxClosure < 0) {
      console.error('--max-closure must be a non-negative integer');
      process.exit(1);
    }
    rest.splice(mcIdx, 2);
  }
  const rootKey = rest[0];
  if (!rootKey) {
    console.error(
      'Usage: node Scripts/jira-delete-issue-tree.js <ISSUE-KEY> [--dry-run] [--count-only] [--max-closure N]'
    );
    process.exit(1);
  }
  return { rootKey, dryRun, maxClosure, countOnly };
}

async function deleteIssue(issueIdOrKey) {
  const baseUrl = process.env.JIRA_URL.replace(/\/$/, '');
  const p = `/rest/api/3/issue/${encodeURIComponent(issueIdOrKey)}?deleteSubtasks=true`;
  return jiraRequest(baseUrl + p, { method: 'DELETE' });
}

async function run() {
  loadEnvFromFile();
  if (!process.env.JIRA_URL || !process.env.JIRA_USERNAME || !process.env.JIRA_API_TOKEN) {
    console.error('Set JIRA_URL, JIRA_USERNAME, JIRA_API_TOKEN (e.g. from .cursor/.env).');
    process.exit(1);
  }

  const { rootKey, dryRun, maxClosure, countOnly } = parseArgs();
  const R = rootKey;

  console.log(
    'Building closure from',
    R,
    dryRun ? '(DRY RUN)' : '',
    countOnly ? '(COUNT ONLY)' : '',
    maxClosure > 0 ? `(max-closure ${maxClosure})` : '(full tree — may take a long time)'
  );

  const closure = await collectClosure(R, { maxClosure });
  const parentRaw = await getIssueFields(R).catch(() => null);
  const P = parentRaw && parentRaw.fields && parentRaw.fields.parent && parentRaw.fields.parent.key;

  if (P) closure.delete(P);

  if (countOnly) {
    console.log('');
    console.log('Delete set size (issues the script would try to remove, in some order):', closure.size);
    console.log('Parent of root (not deleted):', P || '(none)');
    if (maxClosure > 0) {
      console.log('(Count may be capped by --max-closure; omit it for the full reachable set.)');
    }
    process.exit(0);
  }

  const parentOf = new Map();
  for (const k of closure) {
    let raw;
    try {
      raw = await getIssueFields(k);
    } catch (e) {
      console.warn('Could not read parent for', k, e.message);
      continue;
    }
    const par = raw.fields && raw.fields.parent && raw.fields.parent.key;
    if (par) parentOf.set(k, par);
  }

  const others = [...closure].filter((k) => k !== R);
  const orderedOthers = postOrderByParent(others, parentOf);

  const deleteSequence = [...orderedOthers, R];

  console.log('Closure size:', closure.size, '| Parent of root (not deleted):', P || '(none)');
  console.log('Delete sequence (', deleteSequence.length, 'issues):');
  deleteSequence.forEach((k, i) => {
    const tag = k === R ? ' <- root (last)' : '';
    console.log(`  ${i + 1}. ${k}${tag}`);
  });

  if (dryRun) {
    console.log('DRY RUN: no deletions. Run without --dry-run to delete.');
    return;
  }

  for (const key of deleteSequence) {
    try {
      await deleteIssue(key);
      console.log('Deleted', key);
    } catch (e) {
      console.error('Failed', key, e.message);
    }
  }
  console.log('Done.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
