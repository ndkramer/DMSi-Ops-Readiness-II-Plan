# Work Management (WM)

Normative planning for the **Work Management** capability (single trusted view of work, capacity, prioritization).

## Canonical documents

| Artifact | Purpose |
|----------|---------|
| **`WM-WBS.md`** | Outcome-based **Work Breakdown Structure** — success criteria, deliverables, dependencies, risks, decisions. |
| **`wm-outcomes.json`** | Optional **structured** outcome ↔ Jira keys for scripts; **extend** when §9 Jira mapping is finalized (same idea as `PA/pa-outcomes.json`). |
| **`WM-Outcome-Map.html`** | Visual timeline. |
| **`WM-kanban.html`** | Per-outcome boards. |
| **`WM-Constraint-vs-Outcome-Map.html`** | Stage-gate vs outcome model. |

## Jira exports (`Jira/`)

- **Dated full exports:** `WM-Jira-MM-DD-YYYY-json.json` — **keep multiple** dated files for history (same convention as PA).
- **Target-state import JSON:** `Output/WM-WBS-Load-Snapshot.json` (regenerate with `node Scripts/legacy/jira/wm-wsb-to-jira-import.js` when WBS-derived structure changes). **`Output/Archive/`** holds dated snapshots from WBS load prep. See **`Jira/README.md`**.

## Folder layout

| Path | Role |
|------|------|
| **`Input/`** | Stakeholder inputs for WBS loads (create when needed). |
| **`Output/`** | `WM-WBS-Load-Snapshot.json` and **`Output/Archive/`**. |
| **`Update-Reports/`** | WBS load reports. |
| **`Archive/`** | Point-in-time copies of **`WM-WBS.md`**. |

## Conventions

- Outcome IDs: **WM-OC-01** … **WM-OC-09**; deliverables **WM-OC-XX.Y**.
- Cursor rules: **`.cursor/rules/wm.mdc`**; WBS load skill: **`.cursor/skills/wbs-update-pattern/`**.
