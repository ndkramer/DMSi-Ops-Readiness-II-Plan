# Scripts

## WBS Load Prep

**Script:** `wbs-load-prep.js`

Archives the current WBS and Jira-import JSON (if present) and creates a WBS-Load report stub for a capability. Part of the [WBS Update Pattern](../Documentation/WBS-Update-Pattern.md). You can also trigger the full process by saying e.g. **"Import the latest PA WBS information"** (see [.cursor/skills/wbs-update-pattern/](../.cursor/skills/wbs-update-pattern/)).

**Usage (from project root):**

```bash
node Scripts/wbs-load-prep.js <capability>
```

**Examples:**

- `node Scripts/wbs-load-prep.js PA`
- `node Scripts/wbs-load-prep.js VI`
- `node Scripts/wbs-load-prep.js WM` (JSON archive skipped if `WM/Output/WM-WBS-Jira-Import.json` does not exist)

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

**Script:** `wbs-load-report-counts.js`

After regenerating the Jira import JSON, run this to fill the report’s **Change summary** table with added/deleted/updated counts (by diffing archived vs current JSON).

**Usage (from project root):**

```bash
node Scripts/wbs-load-report-counts.js <capability> <dateStamp>
```

**Example:** `node Scripts/wbs-load-report-counts.js PA 03-17-2026`

Requires the archived JSON and current JSON to exist; updates the corresponding `Update-Reports/WBS-Load-{dateStamp}.md` file in place.

---

## WBS Move Input to Archive

**Script:** `wbs-move-input-to-archive.js`

After processing is complete (Input files read, WBS updated or mapped, report filled), run this to move all files from `{Folder}/Input/` to `{Folder}/Input/Archive/{dateStamp}/` so they are marked as processed. Use the same **dateStamp** as the WBS-Load report for that run.

**Usage (from project root):**

```bash
node Scripts/wbs-move-input-to-archive.js <capability> <dateStamp>
```

**Example:** `node Scripts/wbs-move-input-to-archive.js PA 03-17-2026`

Run after the "Review Input and regenerate WBS" step; if Input/ is already empty, the script exits 0 and logs "No files to move."

---

## Jira Export (capability from Jira)

**Script:** `jira-export-pa.js`

Reusable process to export a capability's **full Jira hierarchy** (capability root + all Epics, Stories, Sub-tasks, Action Items) to `{Capability}/Jira/{Prefix}-Jira-mm-dd-yyyy-json.json`. You can say **"Export PA WSA-2656 from Jira"** (or "Export PA from Jira"); see [.cursor/skills/jira-export/SKILL.md](../.cursor/skills/jira-export/SKILL.md).

**Usage (from project root):**

```bash
node Scripts/jira-export-pa.js                    # PA, WSA-2656, WSA-2657
node Scripts/jira-export-pa.js PA
node Scripts/jira-export-pa.js PA WSA-2656
node Scripts/jira-export-pa.js PA WSA-2656 WSA-2657
```

**Requirements:** `JIRA_URL`, `JIRA_USERNAME`, and `JIRA_API_TOKEN` in the environment (or in `.cursor/.env`). Uses Jira REST API v3; fetches full issue details when the search API returns minimal results.

See [PA/Jira/README.md](../PA/Jira/README.md) for output format and folder.

---

## Jira Delete Under Root

**Script:** `jira-delete-under-root.js`

Deletes **all** work items under a capability root (Epics, Stories, Sub-tasks, Action Items) while **leaving the root and action-item root** (e.g. WSA-508 and WSA-509). Uses the same hierarchy and env as `jira-export-pa.js`. Deletes in order: Sub-tasks → Stories → Epics → Action Items.

**Usage (from project root):**

```bash
node Scripts/jira-delete-under-root.js <capability> [rootKey] [actionItemRoot] [--dry-run]
```

**Examples:**

- `node Scripts/jira-delete-under-root.js VI` — delete all under WSA-508 and action items under WSA-509
- `node Scripts/jira-delete-under-root.js VI WSA-508 WSA-509`
- `node Scripts/jira-delete-under-root.js VI --dry-run` — list counts and keys only; no deletions

**Requirements:** Same as Jira Export (`JIRA_URL`, `JIRA_USERNAME`, `JIRA_API_TOKEN`). See [Documentation/JQL-Capability-Hierarchy.md](../Documentation/JQL-Capability-Hierarchy.md) for capability roots.
