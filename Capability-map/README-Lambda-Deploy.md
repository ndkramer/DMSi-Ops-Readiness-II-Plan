# Capability Map – Lambda deployment

This folder contains the **Capability Map** HTML and the Lambda handler that serves it. Pushing to GitHub deploys the latest version to your existing AWS Lambda.

## How it works

- **`capability-map.html`** – Single-page capability map (no local script/CSS dependencies).
- **`capability-map-dmsi.html`** – Same app; loads DMSi artifact URL overrides from `capability-map-artifacts-dmsi.json` (or use `capability-map.html?artifacts=dmsi`).
- **`capability-map-artifacts-dmsi.json`** – Sparse list of `{ "capabilityId", "num", "artifactsUrl" }` under `overrides`; shared state remains in `capability-map-state.json`.
- **`index.mjs`** – Node.js Lambda handler (ESM). Serves the HTML at `/` and supports Lambda Function URL `rawPath`-style routing.

Deployments are done by the GitHub Actions workflow [Deploy Capability Map to Lambda](../.github/workflows/deploy-capability-map.yml).

## GitHub setup (one-time)

In your GitHub repo: **Settings → Secrets and variables → Actions**.

Add these **secrets**:

| Secret                  | Description                          |
|-------------------------|--------------------------------------|
| `AWS_ACCESS_KEY_ID`     | IAM user access key for Lambda deploy |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key                  |
| `LAMBDA_FUNCTION_NAME`  | Exact name of your Lambda function   |

Optional **variable** (defaults to `us-east-1` if unset):

| Variable     | Description    |
|-------------|----------------|
| `AWS_REGION`| Lambda region  |

The IAM user/role must have at least: `lambda:UpdateFunctionCode`, `lambda:GetFunction`.

## When deployments run

- **Automatic:** Push to `main` that changes files under `Capability-map/` included in the deploy zip (see workflow) or the workflow file itself.
- **Manual:** Actions tab → “Deploy Capability Map to Lambda” → “Run workflow”.

## Lambda configuration

Your Lambda should be:

- **Runtime:** Node.js 18.x or 20.x.
- **Handler:** `index.handler` (for `index.mjs`).
- **Function URL:** Enable a function URL (HTTP) so the map is reachable in a browser.

After the first deploy from GitHub, the Lambda will serve the latest `capability-map.html` from this repo at the function URL root.

## If the new HTML doesn’t show after a successful deploy

1. **Browser cache** – Do a hard refresh (e.g. Cmd+Shift+R / Ctrl+Shift+R) or open the Function URL in an incognito/private window. The handler sends `Cache-Control: no-cache, max-age=0` so new loads should not be cached.
2. **Lambda warm starts** – A warm execution environment may still be running the previous deployment. Wait a few minutes and reload, or invoke the function a few times so Lambda spins up new environments with the new code.
