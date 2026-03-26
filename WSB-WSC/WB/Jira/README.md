# WB — Jira exports

## Dated exports

- **`WB-Jira-MM-DD-YYYY-json.json`** — full Jira API exports once **`wb-outcomes.json`** lists capability and action-item keys and you run **`node Scripts/jira-export-wb.js`** (or **`node Scripts/jira-export-pa.js WB <capabilityKey> <actionEpicKey>`**). **Retain multiple** dated files for history (same pattern as **`WSA/PA/Jira/`** and **`WSA/WM/Jira/`**). The shared exporter does **not** write PA-style `pa-kanban-jira-status.*` files for WB; **`WB-kanban.html`** is WBS-static until wired to Jira.

## Target-state import JSON

- **`../Output/WB-WBS-Jira-Import.json`** — seed Epics for WB-OC-01…05; extend with Stories/Sub-tasks from **`WB-WBS.md`**.
- **`../Output/Archive/WB-WBS-Jira-Import-mm-dd-yyyy.json`** — snapshots from **`node Scripts/wbs-load-prep.js WB`**.

## WBS alignment

Normative structure: **`WB-WBS.md`**. Optional registry: **`../wb-outcomes.json`**.
