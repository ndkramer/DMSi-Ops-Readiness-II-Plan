# Dynamo-OS — intake requirements (handoff)

**Purpose:** Give the **Dynamo-OS** repository maintainers everything needed to bootstrap the tooling repo and align with the first consumer. You can copy this file into the Dynamo-OS repo as **`requirements.md`** (or `docs/requirements.md`). Keep a **link back** to the full PRD in the consumer repo when both exist.

**Full product requirements (canonical):** [Dynamo-os-prd.md](./Dynamo-os-prd.md) in **DMSI-OP-Readiness-OS** (same `Requirements/` folder as this file). **GitHub location (canonical):** **`https://github.com/DynamoLLC-Hub/DMSI-OP-Readiness-OS`**. PRD path in repo: `Requirements/Dynamo-os-prd.md`.

---

## 1. What Dynamo-OS is for

- **npm package** + **`dynamo-os` CLI** (or scoped name, e.g. `@org/dynamo-os`) consumed as a **devDependency** from each **project planning repo**.
- **Libraries** for: WBS load lifecycle, Gantt data build, capability-map date sync, optional **transitional** Jira HTTP adapters, generic Lambda static-file handler.
- **No planning content** in Dynamo-OS — only code, tests, README, optional **Cursor skill/rule templates** for new project repos.

---

## 2. Decisions the Dynamo-OS design must respect

| Topic | Decision |
|--------|----------|
| **Project layout** | Workstream folders at **repo root** (e.g. `WSA/`, `WSB-WSC/`); capabilities nested (e.g. `WSA/PA/`). No required parent `Workstreams/`. Paths come from **`dynamo-os.config`**. |
| **Planning SoT** | **Git** holds human-facing planning (WBS, HTML maps, Gantt inputs). |
| **Runtime / ops data** | **S3** and **SSM** for operational data — not mixed into “must be in git” planning without a documented path. |
| **Automation → git** | Reviewable planning outputs land via **GitHub App + PR** or **branch + PR**, not silent push to `main`. |
| **Jira** | **Long-term: remove Jira dependencies.** Treat Jira modules as **pluggable adapters**, not permanent coupling. Do not require Jira issue keys as the only stable IDs for outcomes. |
| **Lambda** | Today: one static ZIP deploy per consumer repo. **Additional Lambdas** (API/schedule) may follow; separate IAM/secrets; static hosting stays read-mostly. |

---

## 3. First consumer (reference implementation)

- **Repository:** **DMSI-OP-Readiness-OS** — **canonical remote:** **`https://github.com/DynamoLLC-Hub/DMSI-OP-Readiness-OS.git`**. Update this file and the PRD if the URL or default branch changes.
- **AWS:** CI should deploy the capability-map **Lambda** into the **Dynamo AWS account**, typically in the **same final cutover phase** as the GitHub move (or immediately after), when **function name, region, IAM/OIDC to the new GitHub repo, and Actions secrets** are set.
- **Paths to study** (relative to that repo root):

| Concern | Location |
|---------|----------|
| Capability paths | **`dynamo-os.config.cjs`** + **`Scripts/planning-path-context.js`**; legacy fallback **`Scripts/wbs-capability-folder.js`** |
| npm wiring | Root **`package.json`** → **`dynamo-os-planning-toolkit`** (`npm install`, then **`npm run plan:validate`**) |
| Jira export / delete / import / link (optional) | **Toolkit:** `dynamo-os/planning-toolkit` → `dynamo-plan jira …`; **DMSI legacy shims:** `Scripts/legacy/jira/*` (not part of default WBS workflow) |
| WBS load prep / archive / report counts | `Scripts/wbs-load-prep.js`, `wbs-move-input-to-archive.js`, `wbs-load-report-counts.js` |
| Kanban status from Jira export (optional) | `Scripts/legacy/jira/jira-kanban-status-from-export.js` |
| Gantt JSON build | `Project-Plan/build-gantt-data.js` |
| Capability map ↔ outcome maps sync | `Capability-map/sync-stage-dates-from-outcome-maps.js` |
| Lambda handler | `Capability-map/index.mjs` |
| Deploy packaging (consumer-owned) | `.github/workflows/deploy-capability-map.yml` |

- **Cursor patterns:** `.cursor/skills/`, `.cursor/rules/` — must stay consistent with CLI commands after port (templates may ship from Dynamo-OS).

---

## 4. `dynamo-os.config` (minimum viable schema)

Start small; evolve with DMSI. Conceptual fields:

- **`projectRoot`** — usually `.`
- **`capabilities`** — map: id → `{ diskPath, filePrefix, jiraCapabilityRoot?, jiraActionItemRoot? }` (Jira fields optional / omitted when adapter retired)
- **`jira`** — optional: env file path (default `.cursor/.env`), base URL pattern
- **`gantt`** — `wbsPaths[]`, `baseYear`, `output` path
- **`capabilityMapSync`** — paths to outcome-map HTML + stage mapping rules
- **`lambdaPackage`** (optional later) — globs or paths for ZIP layout documentation / helper command

**Hard requirement:** No DMSI-only paths or Jira keys baked into library code — only in **consumer config** or env.

---

## 4a. Code migration approach (summary)

Port from DMSI using a **strangler**: **config + path resolution first**, then **WBS scripts**, then **gantt + capability-map sync**, then **Jira** (pluggable), then **Lambda handler**. Use **`npm link`** or **`file:`** dependency while iterating; keep **thin `Scripts/` shims** in DMSI until parity is proven; add **`docs/CODE-MAPPING.md`** in Dynamo-OS. Full detail: [Dynamo-os-prd.md](./Dynamo-os-prd.md) § **Code migration approach (DMSI → Dynamo-OS)**.

---

## 5. Deliverables for the Dynamo-OS repo (bootstrap checklist)

- [ ] `package.json` with `bin` → CLI entrypoint; MIT or org license; Node LTS range documented
- [ ] README: install, `dynamo-os --help`, link to **this** requirements doc and consumer PRD
- [ ] First CLI command proving config load (e.g. `jira export` or `paths print`)
- [ ] Shared modules: HTTP + auth for Jira (transitional), path resolution from config
- [ ] Tests for path resolution and at least one CLI happy path
- [ ] Changelog / semver discipline
- [ ] Optional: `templates/cursor-skills/`, `templates/cursor-rules/` mirroring Dynamo-os-prd guidance
- [ ] Optional: `dynamo-os package-lambda` or documented ZIP recipe aligned with consumer workflow

---

## 6. Information only the product owner can supply (if missing)

- **Dynamo GitHub:** canonical repo **`DynamoLLC-Hub/DMSI-OP-Readiness-OS`** — confirm default branch and org access; archive or redirect any superseded remotes per org policy
- **Dynamo AWS:** account ID (if needed for docs), region for Lambda, **function name(s)**, OIDC trust to GitHub vs access keys, and the exact **GitHub Actions secret names** for deploy
- **npm scope** and registry (npmjs org vs GitHub Packages)
- **Final package name** (`dynamo-os` vs `@one80labs/dynamo-os`)
- **Whether** first release is public or private
- **AWS** conventions for any future non-static Lambdas (naming, schedules, additional ARNs)

---

## 7. Acceptance (DMSI)

DMSI is “up to speed” when:

1. `dynamo-os.config` exists at repo root and one command (e.g. Jira export or `paths verify`) runs from a clean clone with only env + config.
2. Remaining `Scripts/*.js` are thin wrappers or removed in favor of documented `npx dynamo-os …` commands.
3. CI still deploys Lambda; either the workflow calls Dynamo-OS for packaging or follows Dynamo-OS docs verbatim.

---

## 8. Related files in the consumer repo

- [Dynamo-os-prd.md](./Dynamo-os-prd.md) — full PRD (layout, migration, Cursor rules evaluation, risks)
- `Documentation/Project-Structure.md` — current tree snapshot
- `Documentation/WBS-Update-Pattern.md`, `Documentation/legacy/` (Jira-related historical docs)
- `.cursor/skills/wbs-update-pattern/SKILL.md`
