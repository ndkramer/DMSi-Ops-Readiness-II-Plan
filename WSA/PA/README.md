# Pipeline Automation (PA)

Normative planning for the **Pipeline Automation** capability (NGINX config pipeline, Jira root **WSA-2656**).

## Canonical documents

| Artifact | Purpose |
|----------|---------|
| **`PA-WBS.md`** | Outcome-based **Work Breakdown Structure** — success criteria, deliverables, dependencies, risks, decisions, Jira mapping (human-readable). |
| **`pa-outcomes.json`** | **Structured** outcome IDs ↔ Jira Epic keys (`schema_version` ≥ 2); **`dependency_edges`** is the canonical store for `PA-Outcome-map.html` Dependency Flow (timing, Type 1/2, PA-CW-XX). **Keep in sync** with `PA-WBS.md` §3–§9 when edges or decisions change; refresh the HTML’s `#pa-dependency-edges-fallback` block after editing JSON. |
| **`PA-Outcome-map.html`** | Visual timeline and outcome bands. |
| **`PA-kanban.html`** | Per-outcome boards; **embedded** `outcomeData` in the file (WBS deliverables and subtask checklists). **Does not** load Jira `pa-kanban-jira-status` — align content with **`PA-WBS.md`** when outcomes change. |
| **`PA-Constraint-vs-Outcome-Map.html`** | Stage-gate vs outcome model comparison. |

**Jira (optional, legacy):** This repo no longer includes **`WSA/PA/Jira/`**. If you run **`dynamo-plan jira export`** or `Scripts/legacy/jira/jira-export-pa.js`, the toolkit **recreates** that folder and writes dated exports and `pa-kanban-jira-status.*` there. **`PA-kanban.html`** does not use those files. Export shapes and WBS load snapshot format: [Documentation/legacy/Jira-Json-Import.md](../Documentation/legacy/Jira-Json-Import.md), [Documentation/legacy/Jira-Export-Process.md](../Documentation/legacy/Jira-Export-Process.md). **`Output/PA-WBS-Load-Snapshot.json`** is the WBS load snapshot (not from Jira).

## Folder layout

| Path | Role |
|------|------|
| **`Input/`** | Stakeholder inputs for WBS loads; processed files move to **`Input/Archive/<date>/`**. |
| **`Output/`** | WBS load snapshot (`PA-WBS-Load-Snapshot.json`) and **`Output/Archive/`** dated copies. |
| **`Update-Reports/`** | WBS load reports (`WBS-Load-mm-dd-yyyy.md`). |
| **`Archive/`** | Point-in-time copies of **`PA-WBS.md`** before major loads (`PA-WBS-mm-dd-yyyy.md`). |

## Conventions

- Outcome IDs: **PA-OC-00** … **PA-OC-11**; deliverables **PA-OC-XX.Y**.
- **Jira** is the authoritative backlog for execution; **PA-WBS.md** is normative for outcomes and IDs.
- Cursor rules: **`.cursor/rules/pa.mdc`**; WBS load / Jira alignment skill: **`.cursor/skills/wbs-update-pattern/`**.

**Sibling capabilities:** VI and WM use the same conventions — **`VI-WBS.md`** / **`WM-WBS.md`**, **`VI-WBS-Load-Snapshot.json`** / **`WM-WBS-Load-Snapshot.json`**, dated **`VI-Jira-*`** / **`WM-Jira-*`** under each **`Jira/`** folder. See **`VI/README.md`** and **`WM/README.md`**.
