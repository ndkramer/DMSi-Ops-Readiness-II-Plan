# Capability Map – Lambda deployment

This folder contains the **Capability Map** HTML and the Lambda handler that serves it. Pushing to GitHub deploys the latest version to your existing AWS Lambda.

## How it works

- **`capability-map.html`** – Single-page capability map (no local script/CSS dependencies).
- **`capability-map-dmsi.html`** – Same app; loads DMSi artifact URL overrides from `capability-map-artifacts-dmsi.json` (or use `capability-map.html?artifacts=dmsi`).
- **`capability-map-artifacts-dmsi.json`** – Sparse list of `{ "capabilityId", "num", "artifactsUrl" }` under `overrides`; shared state remains in `capability-map-state.json`. **Only the copy in this folder** (repo root of the capability map) **is deployed** — not files under [`archive/`](archive/README.md). After experimenting in a snapshot under `archive/`, copy the file here before deploy so Lambda gets the real links, not `PASTE_DMSI_URL` placeholders.
- **`index.mjs`** – Node.js Lambda handler (ESM). Serves the HTML at `/` and supports Lambda Function URL `rawPath`-style routing. **Canonical source:** `dynamo-os/planning-toolkit/lambda/static-handler/index.mjs` (copy here when updating). Default root file is **`capability-map.html`**; override with Lambda env **`LAMBDA_INDEX`** (e.g. `index.html` for other sites).

Deployments are done by the GitHub Actions workflow [Deploy Capability Map to Lambda](../../.github/workflows/deploy-capability-map.yml).

## GitHub setup (one-time)

In your GitHub repo: **Settings → Secrets and variables → Actions**.

Add these **secrets**:

| Secret                  | Description                          |
|-------------------------|--------------------------------------|
| `AWS_ACCESS_KEY_ID`     | IAM user access key for Lambda deploy |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key                  |
| `LAMBDA_FUNCTION_NAME`  | Exact name of your Lambda function   |

Optional **secret** (for [Stalled-Blocked report](../Stalled-Blocked/Stalled-Blocked-rpt.html) on Lambda without `?github_token=`):

| Secret | Description |
|--------|----------------|
| `STALLED_BLOCKED_GITHUB_PAT` | GitHub PAT with read access to the org project and issues. At deploy time the workflow writes `Project-Plan/Stalled-Blocked/Stalled-Blocked-github-token.local.json` into the Lambda zip only (file stays gitignored in the repo). If unset, use `?github_token=` on the report URL (trusted environments) or co-deploy the JSON file manually. |

Optional **variable** (defaults to `us-east-1` if unset):

| Variable     | Description    |
|-------------|----------------|
| `AWS_REGION`| Lambda region  |

The IAM user/role must have at least: `lambda:UpdateFunctionCode`, `lambda:GetFunction`.

**Canonical repo:** `https://github.com/DynamoLLC-Hub/DMSI-OP-Readiness-OS`. If you clone from a new URL or the project moved orgs, **re-create** these secrets and variables on that repository — GitHub does not copy them automatically. After secrets exist, run **Actions → Deploy Capability Map to Lambda → Run workflow** to confirm Lambda deploy succeeds.

**Superseded remote:** If a prior repo (e.g. under a personal account) is retired, **archive** it on GitHub and set the description to “Moved to `https://github.com/DynamoLLC-Hub/DMSI-OP-Readiness-OS`”. Update **Confluence** iframes, bookmarks, and any saved clone URLs to the canonical repo.

## When deployments run

- **Automatic:** Push to `main` that changes files under `Project-Plan/Capability-map/` included in the deploy zip (see workflow) or the workflow file itself.
- **Manual:** Actions tab → “Deploy Capability Map to Lambda” → “Run workflow”.

## Lambda configuration

Your Lambda should be:

- **Runtime:** Node.js 18.x or 20.x.
- **Handler:** `index.handler` (for `index.mjs`).
- **Function URL:** Enable a function URL (HTTP) so the map is reachable in a browser.

After the first deploy from GitHub, the Lambda will serve the latest `capability-map.html` from this repo at the function URL root.

If you use **`CONFLUENCE_TOKEN`** auth, open the map with **`?token=...`** on the HTML URL. The page repeats that token on **`fetch`** requests to `capability-map-state.json` and `capability-map-artifacts-dmsi.json` so those requests are allowed by the same Lambda auth.

## Capability map state JSON vs GitHub

The HTML loads `capability-map-state.json` in this order:

1. **Same-origin** — On the Lambda Function URL, this is the copy **bundled in the last deployment** (not a live stream from GitHub).
2. **Public raw fallback** — `https://raw.githubusercontent.com/.../main/Project-Plan/Capability-map/capability-map-state.json` is used when same-origin fails (e.g. opening the file from disk without a local server).

For a **private** repository, the raw URL returns **404** to anonymous browsers, so step 2 never succeeds. The page then uses **embedded** state baked into the HTML (offline fallback).

**Implication:** After you edit `capability-map-state.json` in Git, the hosted map updates when **CI deploys** a new Lambda zip (or you run the deploy workflow). Pushing to `main` alone does not change the live map until that deploy runs.

**GitHub-linked stages** use the GitHub API via the same-origin **`/github-api`** and **`/github-proxy/graphql`** routes on Lambda (avoids browser CORS to `api.github.com`). **Issue body** (REST `GET /repos/.../issues/N`) works **without** a PAT for **public** repositories; **private** issues still need a PAT (**`?github_token=`** / **`?gh_token=`**, localStorage `dmsiStalledBlockedGithubPat`, or co-deployed **`Project-Plan/Stalled-Blocked/Stalled-Blocked-github-token.local.json`** — see optional secret). **Org Project “Status”** (GraphQL) always requires a PAT. Anonymous REST is subject to GitHub’s rate limit for the Lambda’s outbound IP; a PAT is recommended for reliability.

## Stage artifact links (SharePoint)

The map shows a folder icon whenever `artifactsUrl` is set and is not `#` or `PASTE_DMSI_URL`. For **working** links from the Lambda URL, prefer **full `https://...` SharePoint URLs** in state or in DMSi overrides. **Relative** paths (e.g. `sharepoint-wm-s0.html`) still show the icon but resolve against the Function URL; if that file is not in the deployment package, the handler returns **`Not found`** until you add the file to the zip or switch to full URLs.

## GitHub issue text still missing on the map (Lambda)

`githubIssueUrl` loads issue bodies via the **`/github-api`** proxy. **Public** repositories work without a PAT. **`DynamoLLC-Hub/dynamo-toolbox`** (and other private repos) return **HTTP 403** to anonymous API calls — the map cannot show issue text until a token is available to the page.

**Do one of the following:**

1. **Recommended for team use:** In the repo, add Actions secret **`STALLED_BLOCKED_GITHUB_PAT`** (PAT with `repo` / issue read access to the linked repos). Redeploy the Capability Map workflow so **`Project-Plan/Stalled-Blocked/Stalled-Blocked-github-token.local.json`** is included in the Lambda zip. The map loads that file same-origin (with your existing `?token=` gate).
2. **One-off / trusted browser:** Open the map with **`&github_token=ghp_…`** (or `gh_token`) in addition to `token=`. Do not share that URL.
3. Open the **Stalled/Blocked** report on the same Lambda, paste a PAT when prompted (stored in `localStorage` under `dmsiStalledBlockedGithubPat`); reload the capability map in the same browser.

**Note:** A URL like `…?token=…&github_token=…` is fine for **verifying** that private-issue sync works after a deploy. It is **not** a pattern to keep in bookmarks, Confluence, or chat — the PAT is visible in the address bar and in referrer logs. For day-to-day use, prefer **`STALLED_BLOCKED_GITHUB_PAT`** (deployed JSON) or **`localStorage`** after using the Stalled/Blocked report.

Then hard-refresh the map. Expand a linked stage: errors now include a short hint if GitHub returned 403/404.

## If the new HTML doesn’t show after a successful deploy

1. **Browser cache** – Do a hard refresh (e.g. Cmd+Shift+R / Ctrl+Shift+R) or open the Function URL in an incognito/private window. The handler sends `Cache-Control: no-cache, max-age=0` so new loads should not be cached.
2. **Lambda warm starts** – A warm execution environment may still be running the previous deployment. Wait a few minutes and reload, or invoke the function a few times so Lambda spins up new environments with the new code.
