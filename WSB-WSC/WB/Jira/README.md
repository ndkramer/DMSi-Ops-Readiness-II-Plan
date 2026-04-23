# WB — Jira exports

## Dated exports

- **`WB-Jira-MM-DD-YYYY-json.json`** — full Jira API exports once **`wb-outcomes.json`** lists capability and action-item keys and you run **`node Scripts/legacy/jira/jira-export-wb.js`** (or **`node Scripts/legacy/jira/jira-export-pa.js WB <capabilityKey> <actionEpicKey>`**). **Retain multiple** dated files for history (same pattern as **`WSA/WM/Jira/`** and other capability `Jira/` folders). The shared exporter does **not** write PA-style `pa-kanban-jira-status.*` files for WB; **`WB-kanban.html`** is WBS-static when not wired to live exports.

## Target-state import JSON

- **`../Output/WB-WBS-Load-Snapshot.json`** — seed Epics for WB-OC-01…05; extend with Stories/Sub-tasks from **`WB-WBS.md`**.
- **`../Output/Archive/WB-WBS-Load-Snapshot-mm-dd-yyyy.json`** — snapshots from **`node Scripts/wbs-load-prep.js WB`**.

## WBS alignment

Normative structure: **`WB-WBS.md`**. Optional registry: **`../wb-outcomes.json`**.
