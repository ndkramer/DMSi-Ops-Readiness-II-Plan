---
name: jira-export
description: Exports a capability's full Jira hierarchy (capability root, Epics, Stories, Sub-tasks, Action Items) to {Capability}/Jira. Use when the user asks to export a capability from Jira (e.g. "Export PA WSA-2656 from Jira", "Export PA from Jira", "Export capability PA from Jira").
---

# Jira Export (Capability from Jira)

When the user asks to **export a capability from Jira** (e.g. "Export PA WSA-2656 from Jira", "Export PA from Jira"), run the Jira export script so that **all work items associated with the capability root** (the root issue and all children of all children) are exported and saved under that capability's Jira folder.

## Trigger phrases

- "Export PA WSA-2656 from Jira"
- "Export PA from Jira"
- "Export capability PA from Jira"
- "Export [capability] from Jira" (if the capability is configured)

## What gets exported

- **Capability root** issue (e.g. WSA-2656)
- **Action-item root** issue (e.g. WSA-2657 for PA)
- **Epics** (direct children of the capability root)
- **Stories** (children of each Epic)
- **Sub-tasks** (children of each Story)
- **Action items** (children of the action-item root)

Output includes both **raw Jira issue objects** and **flat lists** (`work_items`, `action_items_flat`) in the same shape as the **WBS Jira-Import** format (`{Capability}-WBS-Jira-Import.json` family).

## Steps

1. **Identify capability and optional root key**  
   From the user's message: capability is usually **PA** (or VI, WM if configured). If they mention a Jira key (e.g. WSA-2656), use it as the capability root; otherwise the script uses the default root for that capability.

2. **Run the export script from the project root**

   ```bash
   node Scripts/jira-export-pa.js [capability] [rootKey] [actionItemRoot]
   ```

   Examples:
   - `node Scripts/jira-export-pa.js` — PA, default WSA-2656 / WSA-2657
   - `node Scripts/jira-export-pa.js PA` — same
   - `node Scripts/jira-export-pa.js PA WSA-2656` — PA, root WSA-2656, default action-item root
   - `node Scripts/jira-export-pa.js PA WSA-2656 WSA-2657` — explicit roots

3. **Output location**  
   The script writes to **`{Capability}/Jira/{Prefix}-Jira-mm-dd-yyyy-json.json`** (e.g. `PA/Jira/PA-Jira-03-17-2026-json.json`). It creates the folder if needed.

4. **Requirements**  
   Jira credentials must be set: `JIRA_URL`, `JIRA_USERNAME`, `JIRA_API_TOKEN` in the environment or in `.cursor/.env`. The script loads `.cursor/.env` if those vars are not set.

## Reference

- Script: [Scripts/jira-export-pa.js](../../Scripts/jira-export-pa.js)
- Output folder and format: [PA/Jira/README.md](../../PA/Jira/README.md)
- Scripts overview: [Scripts/README.md](../../Scripts/README.md)
