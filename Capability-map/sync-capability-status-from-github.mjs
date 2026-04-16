#!/usr/bin/env node
/**
 * Updates `capability-map-state.json` stage `status` from GitHub Projects (v2) single-select
 * field **Status** (or **GitHub Status**) for stages that define `githubIssueUrl`.
 *
 * Mapping (GitHub option → JSON status used by capability-map.html):
 *   Backlog | Ready     → not-started
 *   Advancing | In Review → in-progress
 *   Done               → done
 *
 * Stages without `githubIssueUrl` are unchanged. If the API returns no Status or an
 * unrecognized value, the existing JSON status is kept.
 *
 * Usage (from repo root or Capability-map/):
 *   GITHUB_TOKEN=ghp_… node Capability-map/sync-capability-status-from-github.mjs
 *
 * Token: same PAT as Project-Plan/Stalled-Blocked-rpt.html (read:project, read:org, repo
 * or fine-grained equivalent). Also reads `Project-Plan/Stalled-Blocked-github-token.local.json`
 * when GITHUB_TOKEN / GH_TOKEN are unset.
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_PATH = join(__dirname, 'capability-map-state.json');
const TOKEN_JSON = join(__dirname, '..', 'Project-Plan', 'Stalled-Blocked-github-token.local.json');

const ISSUE_URL_RE = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)\/?$/i;

const GRAPHQL_ISSUE_STATUS = `
query IssueGithubProjectStatus($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    issue(number: $number) {
      projectItems(first: 25) {
        nodes {
          fieldValues(first: 40) {
            nodes {
              __typename
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field {
                  ... on ProjectV2SingleSelectField {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

function resolveToken() {
  const env = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (env && String(env).trim()) return String(env).trim();
  try {
    const raw = readFileSync(TOKEN_JSON, 'utf8');
    const data = JSON.parse(raw);
    const t = data && (data.github_token || data.gh_token || data.token);
    if (t && String(t).trim() && String(t).indexOf('PASTE_YOUR') < 0) return String(t).trim();
  } catch {
    /* missing or invalid */
  }
  return null;
}

function parseGithubIssueUrl(url) {
  const m = String(url || '').trim().match(ISSUE_URL_RE);
  if (!m) return null;
  return { owner: m[1], repo: m[2], issue: parseInt(m[3], 10) };
}

/** Same logic as Stalled-Blocked-rpt.html projectStatusOptionFromNode (Status / GitHub Status). */
function statusFieldNameFromProjectItems(data) {
  const issue = data?.repository?.issue;
  const nodes = issue?.projectItems?.nodes;
  if (!nodes || !nodes.length) return '';
  for (const item of nodes) {
    const fvNodes = item?.fieldValues?.nodes;
    if (!fvNodes) continue;
    for (const n of fvNodes) {
      if (!n || n.__typename !== 'ProjectV2ItemFieldSingleSelectValue') continue;
      const fname = String((n.field && n.field.name) || '')
        .trim()
        .toLowerCase();
      if (fname === 'status' || fname === 'github status') {
        return String(n.name || '').trim();
      }
    }
  }
  return '';
}

/**
 * @param {string} githubStatus — raw single-select option from GitHub
 * @returns {'not-started'|'in-progress'|'done'|null}
 */
function mapGithubStatusToJson(githubStatus) {
  const t = String(githubStatus || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  if (t === 'backlog' || t === 'ready') return 'not-started';
  if (t === 'advancing' || t === 'in review') return 'in-progress';
  if (t === 'done') return 'done';
  return null;
}

async function graphqlFetch(token, query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'DMSI-capability-map-status-sync',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || `GraphQL HTTP ${res.status}`);
  }
  if (json.errors && json.errors.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  return json.data;
}

async function main() {
  const token = resolveToken();
  if (!token) {
    console.error(
      'Set GITHUB_TOKEN or GH_TOKEN, or add a real token to Project-Plan/Stalled-Blocked-github-token.local.json'
    );
    process.exit(1);
  }

  const state = JSON.parse(readFileSync(STATE_PATH, 'utf8'));
  const stages = state.stages;
  if (!Array.isArray(stages)) {
    console.error('Invalid state: missing stages array');
    process.exit(1);
  }

  const linked = stages
    .map((s, index) => ({ s, index }))
    .filter(({ s }) => s.githubIssueUrl && String(s.githubIssueUrl).trim());

  if (linked.length === 0) {
    console.log('No stages with githubIssueUrl; nothing to update.');
    return;
  }

  const updates = [];
  for (const { s, index } of linked) {
    const parts = parseGithubIssueUrl(s.githubIssueUrl);
    if (!parts) {
      console.warn(`Skip invalid githubIssueUrl: ${s.githubIssueUrl}`);
      continue;
    }
    let data;
    try {
      data = await graphqlFetch(token, GRAPHQL_ISSUE_STATUS, {
        owner: parts.owner,
        name: parts.repo,
        number: parts.issue,
      });
    } catch (e) {
      console.warn(
        `GitHub API error for ${s.githubIssueUrl}: ${e && e.message ? e.message : e} — leaving JSON status`
      );
      continue;
    }
    const ghStatus = statusFieldNameFromProjectItems(data);
    const mapped = mapGithubStatusToJson(ghStatus);
    if (mapped == null) {
      console.warn(
        `No mappable Status for ${s.capabilityId} stage ${s.num} (${s.githubIssueUrl}); GitHub Status="${ghStatus || '(empty)'}" — leaving JSON status`
      );
      continue;
    }
    const prev = s.status;
    if (prev === mapped) {
      console.log(
        `OK ${s.capabilityId} #${s.num}: GitHub Status="${ghStatus}" → ${mapped} (unchanged)`
      );
    } else {
      stages[index].status = mapped;
      updates.push({
        capabilityId: s.capabilityId,
        num: s.num,
        githubStatus: ghStatus,
        from: prev,
        to: mapped,
      });
      console.log(
        `OK ${s.capabilityId} #${s.num}: GitHub Status="${ghStatus}" → ${mapped} (was ${prev})`
      );
    }
  }

  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  state.lastUpdated = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${STATE_PATH}`);
  if (updates.length) {
    console.log('Summary:', JSON.stringify(updates, null, 2));
  } else {
    console.log('No status field changes (or all mapped values matched existing JSON).');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
