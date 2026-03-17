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
- `node Scripts/wbs-load-prep.js WM` (JSON archive skipped if `WM/Output/WM-WSB-Jira-Import.json` does not exist)

**What it does:**

1. Copies `{Folder}/{Prefix}-WSB.md` → `{Folder}/Archive/{Prefix}-WSB-mm-dd-yyyy.md`
2. If present, copies `{Folder}/Output/{Prefix}-WSB-Jira-Import.json` → `{Folder}/Output/Archive/{Prefix}-WSB-Jira-Import-mm-dd-yyyy.json`
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
