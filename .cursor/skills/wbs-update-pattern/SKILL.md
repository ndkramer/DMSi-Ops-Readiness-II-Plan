---
name: wbs-update-pattern
description: Input-based WBS load (PA, VI, WM, WB). **Run `dynamo-plan wbs prep` first** so the current `*-WBS.md` is copied to `Archive/{Prefix}-WBS-<date>.md`; **do not edit the live `*-WBS.md`** (partial or full) until prep completes successfully—then read `Input/`, update WBS sections and outcome/dependency JSON and planning HTML, archive Input, and fill the WBS-Load report. **After any substantive WBS edit**, prepend to **Document Change Log** (see [reference.md](reference.md)). **Dependency Flow JSON-first:** `pa-outcomes.json` → `dependency_edges` (PA), `wsb-wsc-outcome-dependencies.json` (WSB–WSC); HTML `fetch` + `#…-dependency-edges-fallback` for `file://`. Catalog `WSB-WSC/dependency-sources.yml`. Use for import from Input, WBS load, or dependency map / JSON edge updates.
---

# WBS update pattern (Input → WBS)

**Detail tables, `dependency_edges` spec, and full Document Change Log rules** live in [reference.md](reference.md) — read it when doing dependency-flow or multi-file edits.

## When to use

| User intent | Action |
|-------------|--------|
| “Import latest PA WBS from Input”, “Run WBS load for VI”, “Load [capability] from `Input/`” | Follow the steps below for **Input → WBS** |

Use prefixes **PA**, **VI**, **WM**, **WB**; follow [`.cursor/rules/pa.mdc`](../rules/pa.mdc), [vi.mdc](../rules/vi.mdc), [wm.mdc](../rules/wm.mdc), [wb.mdc](../rules/wb.mdc) for the folder you touch.

## At a glance

1. Capability = **PA** / **VI** / **WM** / **WB** (ask if unclear).  
2. `dynamo-plan wbs prep <capability>` (or `node …/planning-toolkit/bin/cli.js wbs prep <capability>`; see [Scripts/README.md](../../../Scripts/README.md)).  
3. **Archive-before-edit:** Confirm prep succeeded and `{Folder}/Archive/{Prefix}-WBS-<mm-dd-yyyy>.md` exists. **Do not** edit the live `{Prefix}-WBS.md` for this load until then; if prep failed, fix the error and stop—do not apply Input-driven WBS changes yet.  
4. Read all of `{Capability}/Input/`, merge into `*-WBS.md` (full or partial sections), update outcomes JSONs and (PA / WSB–WSC) `dependency_edges` and HTML fallbacks per [reference.md](reference.md). Fill **WBS-Load** report; prepend **Document Change Log** on the WBS.  
5. `dynamo-plan wbs report-counts <capability> <dateStamp>`.  
6. `dynamo-plan wbs archive-input <capability> <dateStamp>`.  

**Full steps:** [reference.md](reference.md) (Pattern A — Import WBS from Input).

## Reference index

- [reference.md](reference.md) — dependency flow UI, DCL, file tables, Pattern A checklist  
- [Documentation/WBS-Update-Pattern.md](../../../Documentation/WBS-Update-Pattern.md)

**Reminder:** Commit and push to GitHub regularly so the remote stays aligned with your working copy.
