# VI — Jira exports

## Dated exports

- **`VI-Jira-MM-DD-YYYY-json.json`** — full or partial Jira API exports. **Retain multiple** dated files; do not delete older snapshots when adding a new run.

## Target-state import JSON

- **`../Output/VI-WBS-Load-Snapshot.json`** — shape matches PA’s import schema (`metadata`, `work_items`, `action_items`). Regenerate from **`VI-WBS.md`** when outcomes or deliverables change (manual or future generator).
- **`../Output/Archive/VI-WBS-Load-Snapshot-MM-DD-YYYY.json`** — created by `node Scripts/wbs-load-prep.js VI` before a WBS load.

## WBS alignment

Normative IDs and Jira mapping live in **`VI-WBS.md`** §9. Optional registry: **`../vi-outcomes.json`**.
