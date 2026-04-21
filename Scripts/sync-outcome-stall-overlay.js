#!/usr/bin/env node
/**
 * Regenerates Project-Plan/outcome-stall-overlay.json from GitHub org Project (v2),
 * same source as Project-Plan/Stalled-Blocked/Stalled-Blocked-rpt.html.
 *
 * Mapping: each Issue/PR with label Stalled or Blocked is grouped under planning outcomes
 * found via (1) labels matching /^(wm|vi|pa|wb)-oc-\\d+(\\.\\d+)?$/i → WM-OC-03, etc., or
 * (2) title prefix like [WM-OC-03.1] (rolls up to WM-OC-03). Issues with no outcome
 * signal are skipped (warning on stderr). Blocked wins if both labels present.
 *
 * Usage (repo root):
 *   GITHUB_TOKEN=ghp_... node Scripts/sync-outcome-stall-overlay.js
 *
 * Token: classic PAT (read:project, read:org, repo) or fine-grained with org Projects read
 * + issues on relevant repos (same as Stalled-Blocked report).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG = {
  orgLogin: 'DynamoLLC-Hub',
  projectNumber: 1,
  labelNames: ['stalled', 'blocked']
};

const GRAPHQL = `
query OrgProjectItems($org: String!, $projectNumber: Int!, $cursor: String) {
  organization(login: $org) {
    projectV2(number: $projectNumber) {
      title
      items(first: 50, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          content {
            __typename
            ... on Issue {
              title
              number
              url
              repository { name nameWithOwner }
              labels(first: 30) { nodes { name } }
            }
            ... on PullRequest {
              title
              number
              url
              repository { name nameWithOwner }
              labels(first: 30) { nodes { name } }
            }
          }
        }
      }
    }
  }
}
`;

const PREFIX_MAP = { wm: 'WM', vi: 'VI', pa: 'PA', wb: 'WB' };
const LABEL_OC_RE = /^(wm|vi|pa|wb)-oc-(\d+)(\.\d+)?$/i;
/** Any [WM-OC-03] or [WM-OC-03.1] substring in title (not only at start). */
const TITLE_BRACKET_RE = /\[([A-Za-z]{2}-OC-\d+(?:\.\d+)?)\]/g;

function labelMatchesStalledBlocked(labelNodes) {
  const want = {};
  CONFIG.labelNames.forEach((n) => {
    want[n.toLowerCase()] = true;
  });
  return labelNodes.some((l) => want[(l.name || '').toLowerCase()]);
}

function stallKindFromLabels(labelNodes) {
  const names = labelNodes.map((l) => (l.name || '').toLowerCase());
  if (names.includes('blocked')) return 'blocked';
  if (names.includes('stalled')) return 'stalled';
  return null;
}

function rollupOutcomeId(id) {
  const u = id.toUpperCase();
  const m = u.match(/^([A-Z]{2}-OC-\d+)/);
  return m ? m[0] : null;
}

function outcomeIdsFromLabels(labelNodes) {
  const out = new Set();
  for (const l of labelNodes) {
    const name = (l.name || '').trim();
    const m = name.match(LABEL_OC_RE);
    if (!m) continue;
    const cap = PREFIX_MAP[m[1].toLowerCase()];
    if (!cap) continue;
    const rolled = rollupOutcomeId(`${cap}-OC-${m[2]}`);
    if (rolled) out.add(rolled);
  }
  return out;
}

function outcomeIdsFromTitle(title) {
  const out = new Set();
  const t = title || '';
  TITLE_BRACKET_RE.lastIndex = 0;
  let m;
  while ((m = TITLE_BRACKET_RE.exec(t)) !== null) {
    const rolled = rollupOutcomeId(m[1]);
    if (rolled && /^(WM|VI|PA|WB)-OC-\d+$/.test(rolled)) out.add(rolled);
  }
  return out;
}

function collectOutcomeIds(labelNodes, title) {
  const a = outcomeIdsFromLabels(labelNodes);
  const b = outcomeIdsFromTitle(title);
  return new Set([...a, ...b]);
}

async function fetchAllItems(token) {
  const allNodes = [];
  let cursor = null;
  let hasNext = true;

  while (hasNext) {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({
        query: GRAPHQL,
        variables: {
          org: CONFIG.orgLogin,
          projectNumber: CONFIG.projectNumber,
          cursor: cursor
        }
      })
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'GraphQL HTTP ' + res.status);
    }
    if (json.errors && json.errors.length) {
      throw new Error(json.errors.map((e) => e.message).join('; '));
    }
    const org = json.data && json.data.organization;
    if (!org || !org.projectV2) {
      throw new Error(
        'projectV2 not found for org ' +
          CONFIG.orgLogin +
          ' project #' +
          CONFIG.projectNumber +
          ' (check token scopes / SSO)'
      );
    }
    const conn = org.projectV2.items;
    if (!conn || !conn.nodes) break;
    conn.nodes.forEach((n) => allNodes.push(n));
    hasNext = conn.pageInfo && conn.pageInfo.hasNextPage;
    cursor = conn.pageInfo && conn.pageInfo.endCursor;
  }
  return allNodes;
}

function main() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token || !String(token).trim()) {
    console.error('Set GITHUB_TOKEN (or GH_TOKEN) to a PAT with org project + issues read access.');
    process.exit(1);
  }

  fetchAllItems(String(token).trim())
    .then((nodes) => {
      const byOutcome = {};

      for (const n of nodes) {
        const c = n.content;
        if (!c || c.__typename === 'DraftIssue') continue;
        if (c.__typename !== 'Issue' && c.__typename !== 'PullRequest') continue;
        const labelNodes = (c.labels && c.labels.nodes) || [];
        if (!labelMatchesStalledBlocked(labelNodes)) continue;

        const kind = stallKindFromLabels(labelNodes);
        if (!kind) continue;

        const oids = collectOutcomeIds(labelNodes, c.title);
        if (!oids.size) {
          console.warn(
            'Skip (no outcome label / [PREFIX] title):',
            c.repository && c.repository.nameWithOwner,
            '#' + c.number,
            JSON.stringify(c.title).slice(0, 80)
          );
          continue;
        }

        const entry = {
          number: c.number,
          title: c.title,
          url: c.url,
          repository: c.repository
            ? { nameWithOwner: c.repository.nameWithOwner }
            : undefined
        };

        for (const oid of oids) {
          if (!byOutcome[oid]) byOutcome[oid] = { stalled: [], blocked: [] };
          byOutcome[oid][kind].push(entry);
        }
      }

      const outPath = path.join(__dirname, '..', 'Project-Plan', 'outcome-stall-overlay.json');
      const payload = {
        _documentation:
          'Maps outcome IDs to GitHub issues with Stalled or Blocked labels. Regenerate: GITHUB_TOKEN=... node Scripts/sync-outcome-stall-overlay.js. Issues need wm-oc-03 style labels or [WM-OC-03] title prefix.',
        generatedAt: new Date().toISOString(),
        byOutcome
      };
      fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
      console.log('Wrote', outPath, 'outcomes with keys:', Object.keys(byOutcome).length);
    })
    .catch((err) => {
      console.error(err.message || err);
      process.exit(1);
    });
}

main();
