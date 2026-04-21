# Scripts

## Dynamo-OS planning config

The project root has **`dynamo-os.config.cjs`** (capability `diskPath`, Jira roots, gantt paths) and **`package.json`** with **`devDependencies.dynamo-os-planning-toolkit`** (`file:../dynamo-os/planning-toolkit` — adjust if your clone layout differs). After **`npm install`** at the repo root:

```bash
npm run validate
npm run plan:validate
npm run plan:paths
```

**`npm run validate`** runs config validation and **`Scripts/validate-plan-artifacts.js`** (JSON checks on key planning files). Other **`npm run plan:*`** scripts wrap **`dynamo-plan`** subcommands; pass arguments after `--`, e.g. `npm run plan:wbs:prep -- PA`.

| Script | CLI equivalent |
|--------|----------------|
| `plan:gantt` | `dynamo-plan gantt build` |
| `plan:gantt:inline` | `dynamo-plan gantt build --inline` |
| `plan:capability-map:sync-dates` | `dynamo-plan capability-map sync-dates` |
| `plan:wbs:prep` | `dynamo-plan wbs prep <CAP>` |
| `plan:wbs:archive-input` | `dynamo-plan wbs archive-input <CAP> <dateStamp>` |
| `plan:wbs:report-counts` | `dynamo-plan wbs report-counts <CAP> <dateStamp>` |
| `plan:jira:export` | `dynamo-plan jira export …` |
| `plan:jira:kanban-rebuild` | `dynamo-plan jira kanban-rebuild [CAP]` |
| `plan:jira:delete-under-root` | `dynamo-plan jira delete-under-root …` |
| `plan:jira:delete-tree` | `dynamo-plan jira delete-tree …` |
| `plan:jira:import-wm` | `dynamo-plan jira import-wm …` |
| `plan:jira:link-wm-action-items` | `dynamo-plan jira link-wm-action-items …` |
| `plan:paths:resolve` | `dynamo-plan paths resolve <CAP>` |

Or invoke the CLI directly:

```bash
node ../dynamo-os/planning-toolkit/bin/cli.js config validate
```

After `npm link` in `dynamo-os/planning-toolkit`, **`dynamo-plan`** is on your PATH as well.

**Legacy wrappers** (`Scripts/wbs-load-prep.js`, `jira-export-pa.js`, etc.) still forward to the same CLI; prefer **`npm run plan:*`** so there is one documented entry point.

---

## WBS Load Prep

**Implementation:** **dynamo-os** `planning-toolkit` command **`dynamo-plan wbs prep`** (paths and `{filePrefix}` come from **`dynamo-os.config.cjs`**). **`Scripts/wbs-load-prep.js`** is a thin wrapper that runs the CLI when a sibling **`dynamo-os/planning-toolkit`** checkout exists (or set **`DYNAMO_PLAN_CLI`** to the absolute path of **`planning-toolkit/bin/cli.js`**).

Archives the current WBS and Jira-import JSON (if present) and creates a WBS-Load report stub for a capability. Part of the [WBS Update Pattern](../Documentation/WBS-Update-Pattern.md). You can also trigger the full process by saying e.g. **"Import the latest PA WBS information"** (see [.cursor/skills/wbs-update-pattern/](../.cursor/skills/wbs-update-pattern/)).

**Preferred usage (from project root):**

```bash
node ../dynamo-os/planning-toolkit/bin/cli.js wbs prep <capability>
```

Or after `npm link` in `dynamo-os/planning-toolkit`:

```bash
dynamo-plan wbs prep <capability>
```

**Legacy wrapper:**

```bash
node Scripts/wbs-load-prep.js <capability>
```

**Examples:**

- `dynamo-plan wbs prep PA` (or `node Scripts/wbs-load-prep.js PA`)
- `dynamo-plan wbs prep VI`
- `dynamo-plan wbs prep WM` (JSON archive skipped if `WSA/WM/Output/WM-WBS-Jira-Import.json` does not exist)

**What it does:**

1. Copies current WBS → Archive (`{Prefix}-WBS.md` → `{Prefix}-WBS-mm-dd-yyyy.md` for PA, VI, WM)
2. If present, copies `{Folder}/Output/{Prefix}-WBS-Jira-Import.json` → `{Folder}/Output/Archive/{Prefix}-WBS-Jira-Import-mm-dd-yyyy.json`
3. Creates `{Folder}/Update-Reports/WBS-Load-mm-dd-yyyy.md` with stub sections:
   - Summary (archived WBS and JSON paths)
   - **Change summary table:** Work items, Risks, Decisions, Questions × Added | Deleted | Updated (initial 0s; see counts script below)
   - Outcome map changes, risks/decisions/questions, keys, other changes, next steps

Date format is `mm-dd-yyyy` (e.g. `03-17-2026`). Same run date is used for all archives.

---

## WBS Load Report Counts

**Implementation:** **`dynamo-plan wbs report-counts`** (see **dynamo-os/planning-toolkit**). **`Scripts/wbs-load-report-counts.js`** forwards to the CLI (sibling **dynamo-os** or **`DYNAMO_PLAN_CLI`**).

After regenerating the Jira import JSON, run this to fill the report’s **Change summary** table with added/deleted/updated counts (by diffing archived vs current JSON).

**Preferred usage (from project root):**

```bash
node ../dynamo-os/planning-toolkit/bin/cli.js wbs report-counts <capability> <dateStamp>
```

**Legacy wrapper:**

```bash
node Scripts/wbs-load-report-counts.js <capability> <dateStamp>
```

**Example:** `dynamo-plan wbs report-counts PA 03-17-2026`

Requires the archived JSON and current JSON to exist; updates the corresponding `Update-Reports/WBS-Load-{dateStamp}.md` file in place.

---

## WBS Move Input to Archive

**Implementation:** **`dynamo-plan wbs archive-input`**. **`Scripts/wbs-move-input-to-archive.js`** forwards to the CLI (sibling **dynamo-os** or **`DYNAMO_PLAN_CLI`**).

After processing is complete (Input files read, WBS updated or mapped, report filled), run this to move all files from `{Folder}/Input/` to `{Folder}/Input/Archive/{dateStamp}/` so they are marked as processed. Use the same **dateStamp** as the WBS-Load report for that run.

**Preferred usage (from project root):**

```bash
node ../dynamo-os/planning-toolkit/bin/cli.js wbs archive-input <capability> <dateStamp>
```

**Legacy wrapper:**

```bash
node Scripts/wbs-move-input-to-archive.js <capability> <dateStamp>
```

**Example:** `dynamo-plan wbs archive-input PA 03-17-2026`

Run after the "Review Input and regenerate WBS" step; if Input/ is already empty, the script exits 0 and logs "No files to move."

---

## Jira Export (capability from Jira)

**Implementation:** **`dynamo-plan jira export`** (**dynamo-os/planning-toolkit**). Capability roots default from **`dynamo-os.config.cjs`** (`jiraCapabilityRoot`, `jiraActionItemRoot` per capability). **`Scripts/jira-export-pa.js`** forwards to the CLI (sibling **dynamo-os** or **`DYNAMO_PLAN_CLI`**).

Reusable process to export a capability's **full Jira hierarchy** (capability root + all Epics, Stories, Sub-tasks, Action Items) to `{Capability}/Jira/{Prefix}-Jira-mm-dd-yyyy-json.json`. For PA, **`jira.kanbanFromExportFor`** can also write **`pa-kanban-jira-status.json`** / **`.js`**. You can say **"Export PA WSA-2656 from Jira"**; see [.cursor/skills/jira-export/SKILL.md](../.cursor/skills/jira-export/SKILL.md).

**Preferred usage (from project root):**

```bash
node ../dynamo-os/planning-toolkit/bin/cli.js jira export
node ../dynamo-os/planning-toolkit/bin/cli.js jira export PA
node ../dynamo-os/planning-toolkit/bin/cli.js jira export PA WSA-2656
node ../dynamo-os/planning-toolkit/bin/cli.js jira export PA WSA-2656 WSA-2657
```

**Legacy wrapper:**

```bash
node Scripts/jira-export-pa.js                    # PA, defaults from config
node Scripts/jira-export-pa.js PA WSA-2656 WSA-2657
```

**Offline kanban rebuild (no API):** **`dynamo-plan jira kanban-rebuild PA`** or **`node Scripts/jira-kanban-status-from-export.js`**.

**Requirements:** `JIRA_URL`, `JIRA_USERNAME`, and `JIRA_API_TOKEN` in the environment (or in **`jira.envFile`**, e.g. `.cursor/.env`). Uses Jira REST API v3; fetches full issue details when the search API returns minimal results.

See [PA/Jira/README.md](../WSA/PA/Jira/README.md) for output format and folder.

---

## Jira Delete Under Root

**Implementation:** **`dynamo-plan jira delete-under-root`** (**dynamo-os/planning-toolkit**). **`Scripts/jira-delete-under-root.js`** forwards to the CLI (sibling **dynamo-os** or **`DYNAMO_PLAN_CLI`**). Roots default from **`dynamo-os.config.cjs`** (`jiraCapabilityRoot`, `jiraActionItemRoot` per capability).

Deletes **all** work items under a capability root (Epics, Stories, Sub-tasks, Action Items) while **leaving the root and action-item root** unless **`--delete-root`** is set. Deletes in order: Sub-tasks → Stories → Epics → Action Items.

**Preferred usage (from project root):**

```bash
node ../dynamo-os/planning-toolkit/bin/cli.js jira delete-under-root VI [--dry-run]
```

**Legacy wrapper:**

```bash
node Scripts/jira-delete-under-root.js VI [--dry-run]
node Scripts/jira-delete-under-root.js VI WSA-508 WSA-509
node Scripts/jira-delete-under-root.js WSA-121 [actionItemRoot] [--delete-root]
```

**Requirements:** Same as Jira Export. See [Documentation/JQL-Capability-Hierarchy.md](../Documentation/JQL-Capability-Hierarchy.md) for capability roots.

---

## Jira Delete Issue Tree

**Implementation:** **`dynamo-plan jira delete-tree`**. **`Scripts/jira-delete-issue-tree.js`** forwards to the CLI.

Deletes a single issue and its **navigable** descendants (post-order). Optional **`--max-closure N`** safety cap.

```bash
node ../dynamo-os/planning-toolkit/bin/cli.js jira delete-tree WSA-1234 --dry-run
```

---

## Jira Import WM / Link WM Action Items

**Implementation:** **`dynamo-plan jira import-wm`** and **`dynamo-plan jira link-wm-action-items`**. **`Scripts/jira-import-wm.js`** and **`Scripts/jira-link-wm-action-items.js`** forward to the CLI. Requires **`capabilities.WM`** and the WM **`Output/{filePrefix}-WBS-Jira-Import.json`** file (paths from config).

```bash
node ../dynamo-os/planning-toolkit/bin/cli.js jira import-wm --dry-run
node ../dynamo-os/planning-toolkit/bin/cli.js jira link-wm-action-items --dry-run
```

---

## WM WBS → Jira import JSON (generator)

**Script:** **`Scripts/wm-wsb-to-jira-import.js`** — regenerates **`{filePrefix}-WBS-Jira-Import.json`** from embedded WM structure (not the full planning toolkit). **Paths and Jira roots** come from **`dynamo-os.config.cjs`** when **`Scripts/planning-path-context.js`** can resolve the sibling **`dynamo-os/planning-toolkit`** (or **`node_modules/dynamo-os-planning-toolkit`**, or **`DYNAMO_PLAN_LIB`**). Otherwise it falls back to **`Scripts/wbs-capability-folder.js`** and hard-coded WSA-2881 / 2882.

```bash
node Scripts/wm-wsb-to-jira-import.js
```

**Shared helper:** **`Scripts/planning-path-context.js`** — `resolvePlanningContext()` for **`loadConfig` + `getCapabilityFolder`** (also used by **`jira-export-wb.js`**).

---
