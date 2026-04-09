# Visibility Infrastructure (VI)

Normative planning for **Visibility Infrastructure & proactive detection** (Dynatrace, PagerDuty AIOps, instrumentation, telemetry). Jira capability root **WSA-120** per `VI-WBS.md` §9.

## Canonical documents

| Artifact | Purpose |
|----------|---------|
| **`VI-WBS.md`** | Outcome-based **Work Breakdown Structure** — success criteria, deliverables, dependencies, risks, decisions, Jira mapping. **§11 Document Change Log** at end of file (prepend dated rows on substantive edits). |
| **`vi-outcomes.json`** | Optional **structured** outcome ↔ Jira keys for scripts; **extend** when §9 epic mapping is fully enumerated (same idea as `PA/pa-outcomes.json`). |
| **`VI-WSB-Outcome-Map.html`** | Visual timeline (filename keeps historical **WSB**; content aligns with **VI-WBS**). |
| **`VI-kanban.html`** | Per-outcome boards. |
| **`VI-Constraint-vs-Outcome-Map.html`** | Constraint vs outcome comparison. |

## Jira exports (`Jira/`)

- **Dated full exports:** `VI-Jira-MM-DD-YYYY-json.json` — **keep multiple** dated files when you run or save exports (same convention as PA).
- **Target-state import JSON (manual / generator):** `Output/VI-WBS-Jira-Import.json` and **`Output/Archive/`** snapshots. See **`Jira/README.md`**.

## Folder layout

| Path | Role |
|------|------|
| **`Input/`** | Stakeholder inputs for WBS loads; processed files move to **`Input/Archive/<date>/`**. |
| **`Output/`** | `VI-WBS-Jira-Import.json` and **`Output/Archive/`**. |
| **`Update-Reports/`** | WBS load reports (`WBS-Load-mm-dd-yyyy.md`). |
| **`Archive/`** | Point-in-time copies of **`VI-WBS.md`**. |

## Conventions

- Outcome IDs: **VI-OC-01** … **VI-OC-16**; deliverables **VI-OC-XX.Y**.
- Cursor rules: **`.cursor/rules/vi.mdc`**; WBS load skill: **`.cursor/skills/wbs-update-pattern/`**.
