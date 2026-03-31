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
   From the user's message: capability is usually **PA** (or VI, WM, WB if configured). Default Jira roots come from **`dynamo-os.config.cjs`** (`jiraCapabilityRoot`, `jiraActionItemRoot`). Override with explicit keys on the CLI when the user names them.

2. **Run the export from the project root** (toolkit CLI or thin wrapper)

   ```bash
   node ../dynamo-os/planning-toolkit/bin/cli.js jira export [capability] [rootKey] [actionItemRoot]
   ```

   Examples:
   - `… jira export` — PA, defaults from config
   - `… jira export PA WSA-2656` — PA, root WSA-2656, default action-item root from config
   - `… jira export PA WSA-2656 WSA-2657` — explicit roots  
   Or: `node Scripts/jira-export-pa.js …` (forwards to the same CLI).

3. **Output location**  
   Writes **`{diskPath}/Jira/{filePrefix}-Jira-mm-dd-yyyy-json.json`** per **`dynamo-os.config.cjs`**. For capabilities listed in **`jira.kanbanFromExportFor`**, also writes **`{cap}-kanban-jira-status.json`** and **`.js`**.

4. **Requirements**  
   `JIRA_URL`, `JIRA_USERNAME`, `JIRA_API_TOKEN` in the environment or in **`jira.envFile`** (e.g. `.cursor/.env`).

## Related planning-toolkit Jira commands

Same **`dynamo-os.config.cjs`**, **`jira.envFile`**, and **`DYNAMO_PLAN_CLI`** / sibling **`dynamo-os/planning-toolkit`** as export. From project root (add **`--cwd <repoRoot>`** if needed):

| Command | Purpose |
|---------|---------|
| `…/cli.js jira kanban-rebuild [CAP]` | Rebuild `{cap}-kanban-jira-status.*` from latest dated export (no API) |
| `…/cli.js jira delete-under-root [CAP] …` | Delete work under **`jiraCapabilityRoot`** / **`jiraActionItemRoot`** (or raw issue-key args); **`--dry-run`** first |
| `…/cli.js jira delete-tree <KEY> …` | Delete one issue + navigable descendants; optional **`--max-closure`** |
| `…/cli.js jira import-wm …` | WM create-from-JSON (**requires `capabilities.WM`**) |
| `…/cli.js jira link-wm-action-items …` | WM action-item link repair (key ranges + import JSON) |

Thin **`Scripts/jira-*.js`** wrappers forward to these subcommands. Details: [Scripts/README.md](../../../Scripts/README.md).

## Reference

- **dynamo-os** planning toolkit: `dynamo-plan jira export`, `jira kanban-rebuild`, and the commands in the table above (sibling **`dynamo-os/planning-toolkit`**, or **`DYNAMO_PLAN_CLI`**).
- Wrapper: [Scripts/jira-export-pa.js](../../../Scripts/jira-export-pa.js)
- Output folder and format: [PA/Jira/README.md](../../../WSA/PA/Jira/README.md)
- Scripts overview: [Scripts/README.md](../../../Scripts/README.md)
