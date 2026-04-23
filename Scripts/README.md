# Scripts

## Dynamo-OS planning config

The project root has **`dynamo-os.config.cjs`** (capability `diskPath`, optional Jira roots, gantt paths) and **`package.json`** with **`devDependencies.dynamo-os-planning-toolkit`** (`file:../dynamo-os/planning-toolkit` — adjust if your clone layout differs). After **`npm install`** at the repo root:

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
| `plan:paths:resolve` | `dynamo-plan paths resolve <CAP>` |

Jira subcommands are **not** exposed as `npm run` entries; optional wrappers live in [`legacy/jira/`](legacy/jira/) if you need them.

Or invoke the CLI directly:

```bash
node ../dynamo-os/planning-toolkit/bin/cli.js config validate
```

After `npm link` in `dynamo-os/planning-toolkit`, **`dynamo-plan`** is on your PATH as well.

**Legacy wrappers** (`wbs-load-prep.js`, etc.) still forward to the same CLI; prefer **`npm run plan:*`** for WBS. Jira shims: [`legacy/jira/README.md`](legacy/jira/README.md).

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
- `dynamo-plan wbs prep WM` (JSON archive skipped if `WSA/WM/Output/WM-WBS-Load-Snapshot.json` does not exist)

**What it does:**

1. Copies current WBS → Archive (`{Prefix}-WBS.md` → `{Prefix}-WBS-mm-dd-yyyy.md` for PA, VI, WM)
2. If present, copies `{Folder}/Output/{Prefix}-WBS-Load-Snapshot.json` → `{Folder}/Output/Archive/{Prefix}-WBS-Load-Snapshot-mm-dd-yyyy.json`
3. Creates `{Folder}/Update-Reports/WBS-Load-mm-dd-yyyy.md` with stub sections:
   - Summary (archived WBS and JSON paths)
   - **Change summary table:** Work items, Risks, Decisions, Questions × Added | Deleted | Updated (initial 0s; see counts script below)
   - Outcome map changes, risks/decisions/questions, keys, other changes, next steps

Date format is `mm-dd-yyyy` (e.g. `03-17-2026`). Same run date is used for all archives.

---

## WBS Load Report Counts

**Implementation:** **`dynamo-plan wbs report-counts`** (see **dynamo-os/planning-toolkit**). **`Scripts/wbs-load-report-counts.js`** forwards to the CLI (sibling **dynamo-os** or **`DYNAMO_PLAN_CLI`**).

After regenerating the WBS, run this to fill the report’s **Change summary** table (by diffing archived vs current `*-WBS-Load-Snapshot.json` in `Output/`, if present; filename comes from the planning toolkit).

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

## Optional: Jira (dynamo-os CLI, legacy shims)

This repo’s **default** process is WBS + planning views only. If you need **`dynamo-plan jira` …** (export, import WM, delete, etc.), use the **dynamo-os** CLI or the archived wrappers in **[`legacy/jira/`](legacy/jira/)** and see **[`legacy/jira/README.md`](legacy/jira/README.md)**. Historical Jira how-tos: **[Documentation/legacy/](../Documentation/legacy/README.md)** when present.

---
