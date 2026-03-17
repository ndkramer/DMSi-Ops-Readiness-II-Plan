# Scripts

## WBS Load Prep

**Script:** `wbs-load-prep.js`

Archives the current WBS and Jira-import JSON (if present) and creates a WBS-Load report stub for a capability. Part of the [WBS Update Pattern](../Documentation/WBS-Update-Pattern.md).

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
3. Creates `{Folder}/Update-Reports/WBS-Load-mm-dd-yyyy.md` with stub sections (including Jira import JSON archived path and next steps to regenerate WBS and Jira JSON)

Date format is `mm-dd-yyyy` (e.g. `03-17-2026`). Same run date is used for all archives.
