# Customer Support (WB) — Workstream B

**Location:** `WSB-WSC/WB/` (capability id for scripts remains **`WB`** — e.g. `node Scripts/wbs-load-prep.js WB`).

Normative planning for the **DMSi Customer Support Transformation** (outcome-based WBS aligned to `WSA/PA/PA-WBS.md` patterns).

## Canonical documents

| Artifact | Purpose |
|----------|---------|
| **`WB-WBS.md`** | Outcome-based **Work Breakdown Structure** — success criteria, deliverables, dependencies, risks, decisions. |
| **`wb-outcomes.json`** | Optional **outcome ↔ Jira** keys for exports; keep in sync with `WB-WBS.md` §11 when Epics exist. |
| **`WB-Outcome-Map.html`** | Visual timeline (program-month grid). |
| **`WB-kanban.html`** | Per-outcome boards (WBS-derived deliverables; not yet Jira-backed). |

**Parent folder (WSB + WSC combined planning):** **`../WSB-WSC-Outcome-Map.html`** loads **`../wsb-wsc-outcome-dependencies.json`** (`dependency_edges` for Operational / Environmental / Technological activities). Catalog of all dependency JSON paths: **`../dependency-sources.yml`**.

## Source material

- **Implementation plan (Word):** `WSB-WSC/WSB/Customer Support Implementation Plan.docx`

## Jira exports (`Jira/`)

- **Dated full exports:** `WB-Jira-MM-DD-YYYY-json.json` — retain multiple dated files (same convention as PA/WM).
- **Target-state import JSON:** `Output/WB-WBS-Load-Snapshot.json` — expand from `WB-WBS.md` as Stories/Sub-tasks are defined for import. **`Output/Archive/`** holds snapshots from `node Scripts/wbs-load-prep.js WB`. See **`Jira/README.md`**.

## Folder layout

| Path | Role |
|------|------|
| **`Input/`** | Stakeholder inputs for WBS loads (Pattern A). |
| **`Output/`** | `WB-WBS-Load-Snapshot.json` and **`Output/Archive/`**. |
| **`Update-Reports/`** | WBS load reports from prep. |
| **`Archive/`** | Point-in-time copies of **`WB-WBS.md`**. |

## WBS update pattern

- **Pattern A (Input → WBS):** `node Scripts/wbs-load-prep.js WB` → process `Input/` → regenerate `WB-WBS.md` → fill report → `node Scripts/wbs-move-input-to-archive.js WB <mm-dd-yyyy>` → update `Output/WB-WBS-Load-Snapshot.json`.
- **Pattern B (Jira ↔ WBS ↔ HTML):** When Jira is live, export to `Jira/`, reconcile `WB-WBS.md` change log and `wb-outcomes.json`, refresh `WB-Outcome-Map.html` / `WB-kanban.html` narratives.

See **`.cursor/skills/wbs-update-pattern/SKILL.md`** and **`Documentation/WBS-Update-Pattern.md`**.

## Conventions

- Outcome IDs: **WB-OC-01** … **WB-OC-05**; deliverables **WB-OC-XX.Y**.
- Cursor rules: **`.cursor/rules/wb.mdc`**.
