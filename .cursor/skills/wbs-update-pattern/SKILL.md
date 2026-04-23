---
name: wbs-update-pattern
description: Two related workflows for Pipeline Automation (PA) and sibling capabilities (VI, WM, WB). (1) Input-based WBS load — run prep script, process Input folder, regenerate WBS, archive Input, report. (2) Jira–WBS–planning alignment — compare Jira export to the capability WBS and planning HTML (e.g. PA-kanban, PA-Outcome-map; WB-kanban when Jira-backed), adjust exports. **After any substantive WBS markdown edit**, prepend a dated row to that file’s end-of-document **Document Change Log** (see [reference.md](reference.md)). **Dependency Flow data is JSON-first:** `pa-outcomes.json` → `dependency_edges` (PA) and `wsb-wsc-outcome-dependencies.json` (WSB–WSC combined map); HTML uses `fetch` plus an embedded `#…-dependency-edges-fallback` for `file://`. Catalog `WSB-WSC/dependency-sources.yml`; deploy workflow zips dependency JSON for Lambda. Use when the user asks to import WBS from Input, OR to align WBS and planning views with Jira, refresh kanban, reconcile POC vs outcomes (PA), update dependency charts or JSON edges, or update planning artifacts after Jira changes.
---

# WBS Update Pattern

**Detail tables, `dependency_edges` spec, full Document Change Log rules, and complete Pattern A/B checklists** live in [reference.md](reference.md) — read it when doing dependency-flow or multi-file edits.

## Pick a pattern

| User intent | Pattern |
|-------------|---------|
| “Import latest PA WBS from Input”, “Run WBS load for VI”, load from `{Capability}/Input/` | **A — Input → WBS** |
| “Align WBS with Jira”, “Update kanban from Jira”, “Reconcile POC / [POC] / outcomes”, refresh `PA-kanban` / `PA-Outcome-map` / `PA-WBS` after Jira | **B — Jira ↔ WBS ↔ planning HTML** |

Use prefixes **PA**, **VI**, **WM**, **WB**; follow [`.cursor/rules/pa.mdc`](../rules/pa.mdc), [vi.mdc](../rules/vi.mdc), [wm.mdc](../rules/wm.mdc), [wb.mdc](../rules/wb.mdc) for the folder you touch.

## Pattern A — at a glance

1. Capability = **PA** / **VI** / **WM** / **WB** (ask if unclear).  
2. `dynamo-plan wbs prep <capability>` (or `node …/planning-toolkit/bin/cli.js wbs prep <capability>`; see [Scripts/README.md](../../../Scripts/README.md)).  
3. Read all of `{Capability}/Input/`, merge into `*-WBS.md`, update outcomes JSONs and (PA / WSB–WSC) `dependency_edges` and HTML fallbacks per [reference.md](reference.md). Fill **WBS-Load** report; prepend **Document Change Log** on the WBS.  
4. `dynamo-plan wbs report-counts <capability> <dateStamp>`.  
5. `dynamo-plan wbs archive-input <capability> <dateStamp>`.  
6. Remind: refresh `{Capability}/Output/*-WBS-Jira-Import.json` as needed. **Full steps:** [reference.md](reference.md) (Pattern A section).

## Pattern B — at a glance (PA-heavy; VI/WM/WB manual)

1. `dynamo-plan jira export` and/or `jira kanban-rebuild PA` (see [reference.md](reference.md) — Pattern B).  
2. Reconcile [PA-WBS.md](../../../WSA/PA/PA-WBS.md), [pa-outcomes.json](../../../WSA/PA/pa-outcomes.json), [PA-Outcome-map.html](../../../WSA/PA/PA-Outcome-map.html), [PA-kanban.html](../../../WSA/PA/PA-kanban.html).  
3. `dependency_edges` is canonical; sync fallback embeds. Validate in browser. Commit; remind to push to **GitHub**.

**VI, WM, WB:** dated Jira JSON, WBS, outcome maps, target import JSON — see [reference.md](reference.md) (end of Pattern B).

## Reference index

- [reference.md](reference.md) — dependency flow UI, DCL, Pattern A, Pattern B, file tables  
- [Documentation/WBS-Update-Pattern.md](../../../Documentation/WBS-Update-Pattern.md)  
- [jira-export/SKILL.md](../jira-export/SKILL.md) — capability export from Jira

**Reminder:** Commit and push to GitHub regularly so the remote stays aligned with your working copy.
