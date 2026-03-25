# PA Jira Export

This folder holds **exports from Jira** for the Pipeline Automation (PA) capability: the WSA-2656 hierarchy and WSA-2657 action items.

## Reusable process: "Export PA WSA-2656 from Jira"

You can say **"Export PA WSA-2656 from Jira"** (or "Export PA from Jira"). The agent will run the export script and place the file here. See [.cursor/skills/jira-export/SKILL.md](../.cursor/skills/jira-export/SKILL.md) for the full process and trigger phrases.

**Planning:** Normative WBS is [`../PA-WBS.md`](../PA-WBS.md). Optional structured outcome ↔ epic keys: [`../pa-outcomes.json`](../pa-outcomes.json). **Keep multiple** dated `PA-Jira-mm-dd-yyyy-json.json` files when re-exporting.

## Export file

- **Summary prefixes in Jira:** Outcome-linked stories often use `[PA-OC-XX]` in the summary. **PA-OC-00** is Epic **WSA-3758**; all **`[POC]`**-prefixed Stories roll up under that Epic (parent **WSA-2656**). Historical Story **WSA-3719** should live under **WSA-3758**.
- **Naming:** `PA-Jira-mm-dd-yyyy-json.json` (e.g. `PA-Jira-03-17-2026-json.json`).
- **Contents:** Single JSON with:
  - `metadata`: export date, root keys (WSA-2656, WSA-2657), counts (epics, stories, subtasks, action_items).
  - `capability`, `action_item_root`: full Jira issue objects for the two roots.
  - `epics`, `stories`, `subtasks`, `action_items`: arrays of full Jira issue objects as returned by the API.
  - **`work_items`**: flat list in the same shape as [PA-WBS-Jira-Import](../Output/PA-WBS-Jira-Import.json) — one entry per Epic, Story, and Sub-task with `key`, `issue_type`, `summary`, `description`, `parent`, `labels`, `owner`, `priority`, `outcome_id`, `category`, `target`, `status`, `component`.
  - **`action_items_flat`**: same flat shape for Action Items (with `link_to`, `link_type`), so you can diff or reuse data like the WSB Jira-Import format.

## How to run the export

From the **project root**:

```bash
node Scripts/jira-export-pa.js              # PA, default WSA-2656 / WSA-2657
node Scripts/jira-export-pa.js PA         # same
node Scripts/jira-export-pa.js PA WSA-2656
node Scripts/jira-export-pa.js PA WSA-2656 WSA-2657
```

Output is written to `PA/Jira/PA-Jira-<mm-dd-yyyy>-json.json`.

**Requirements:**

- Jira credentials in the environment. The script will use `JIRA_URL`, `JIRA_USERNAME`, and `JIRA_API_TOKEN` from `process.env`. If not set, it tries loading from `.cursor/.env` (do not commit that file).
- Node.js (no extra npm dependencies).

Output is written to `PA/Jira/PA-Jira-<mm-dd-yyyy>-json.json` using the current date.

The same run also writes **`pa-kanban-jira-status.json`** and **`pa-kanban-jira-status.js`** for `PA-kanban.html` (per-deliverable status plus **all Stories per outcome Epic**, including team-added work). Offline rebuild: `node Scripts/jira-kanban-status-from-export.js`.

## See also

- [Documentation/Jira-Json-Import.md](../Documentation/Jira-Json-Import.md) — full JSON structure, flat lists, and import workflow
- [Scripts/README.md](../Scripts/README.md) — documents `jira-export-pa.js` and other scripts.
