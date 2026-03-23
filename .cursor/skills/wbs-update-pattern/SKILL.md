---
name: wbs-update-pattern
description: Two related workflows for Pipeline Automation (PA) and sibling capabilities. (1) Input-based WBS load — run prep script, process Input folder, regenerate WBS, archive Input, report. (2) Jira–WBS–planning alignment — compare Jira export to PA-WSB and planning HTML (PA-kanban, PA-Outcome-map), update WBS change log and classifications, adjust kanban/export scripts, rebuild pa-kanban-jira-status. Use when the user asks to import WBS from Input, OR to align the WBS and planning views with Jira, refresh kanban from Jira, reconcile POC vs outcomes, or update PA-kanban / PA-Outcome-map / PA-WSB after Jira changes.
---

# WBS Update Pattern

This skill covers **two** repeatable processes. Pick the one that matches the user’s goal.

| User intent | Pattern |
|-------------|---------|
| “Import latest PA WBS from Input”, “Run WBS load for VI”, load files from `{Capability}/Input/` | **A — Input → WBS** |
| “Align WBS with Jira”, “Update kanban from Jira”, “Reconcile POC / [POC] / outcomes”, refresh `PA-kanban` / `PA-Outcome-map` / `PA-WSB` after Jira | **B — Jira ↔ WBS ↔ planning HTML** |

Capability folders use prefixes **PA**, **VI**, **WM** (this repo documents **PA** most fully). Follow `.cursor/rules/{capability}.mdc` when editing that capability’s artifacts.

---

## Pattern A — Import WBS from Input (archive + regenerate)

When the user asks to **import the latest [capability] WBS information** (or similar), they mean: load everything from that capability’s **Input** folder and follow the full WBS update process.

### 1. Identify the capability

From the user’s message, determine **PA**, **VI**, or **WM**. If unclear, ask.

### 2. Run the prep script

From the **project root**:

```bash
node Scripts/wbs-load-prep.js <capability>
```

Example: `node Scripts/wbs-load-prep.js PA`

This archives the current WBS to `{Folder}/Archive/{Prefix}-WSB-mm-dd-yyyy.md`, archives the Jira-import JSON to `{Folder}/Output/Archive/...` (if present), and creates `{Folder}/Update-Reports/WBS-Load-mm-dd-yyyy.md` with a stub. Note the run date (mm-dd-yyyy) for step 4.

### 3. Review Input and regenerate WBS

- **Read** all files in `{Capability}/Input/`. Process **each file** explicitly.
- **For each file**: extract outcomes, deliverables, phases, risks, decisions, questions, timeline, tables. Either update the WBS (preserving keys and structure per the capability rule file) or document mapping to existing WBS keys.
- **Compare** with the current `{Prefix}-WSB.md` and any constraint vs outcome maps. **Regenerate** the WBS accordingly. Preserve document structure, outcome table, per-outcome sections, risks/decisions/questions tables.
- **Fill the WBS-Load report**: per-file “Input files processed” summaries (filename → extracted content → WBS edits or “mapped to existing keys”). Do not leave this section generic.

### 4. Move processed Input to Archive

```bash
node Scripts/wbs-move-input-to-archive.js <capability> <dateStamp>
```

Use the same **dateStamp** as the WBS-Load report (mm-dd-yyyy).

### 5. Jira import JSON (manual reminder)

After regeneration, remind the user to update `{Capability}/Output/{Prefix}-WSB-Jira-Import.json` from the new WBS if that file is maintained manually. Preserve schema (`metadata`, `work_items`, `action_items`) and WBS keys.

### Reference (Pattern A)

[Documentation/WBS-Update-Pattern.md](../../../Documentation/WBS-Update-Pattern.md)

---

## Pattern B — Jira ↔ WBS ↔ planning HTML alignment (PA)

Use this when the user wants **planning artifacts** (`PA/PA-WSB.md`, `PA/PA-Outcome-map.html`, `PA/PA-kanban.html`) to match **Jira as the authoritative backlog**, or after **Jira** changes (epic keys, POC story naming, subtasks, superseded epics).

### Principles

1. **Jira is source of truth** for execution status, story keys, and Sub-task completion; the WBS defines **normative** outcomes, deliverable IDs, and dependencies.
2. **Reconcile conflicts** explicitly: if static WBS or kanban “planning rows” duplicate or contradict Jira, prefer Jira for **what work exists**; update or remove static rows and **document the change in PA-WSB** (change log bullet with date).
3. **POC vs PA-OC-XX**: The NGINX pipeline POC is **not** a numbered PA-OC outcome; it is typically **Story WSA-3719** with summary prefix **`[POC]`** (same bracket convention as `[PA-OC-xx.y]`). Runner/tooling POC may also appear under **PA-OC-03** (e.g. OC-03.3). Do not invent parallel “POC-1…POC-4” WBS rows if Jira is the only execution home—**drop** them from `PA-kanban.html` `outcomeData` and record the change in the WBS.
4. **Capability keys (PA)** — verify against `.cursor/rules/pa.mdc` and live Jira: **WSA-2656** (capability), **WSA-3268–WSA-3278** (outcome epics), **WSA-2657** (action items epic), legacy **WSA-36** → **WSA-3268**.

### Steps (checklist)

1. **Refresh Jira data (PA)**  
   - Run `node Scripts/jira-export-pa.js` from project root (needs `JIRA_URL`, `JIRA_USERNAME`, `JIRA_API_TOKEN` in env or `.cursor/.env`), **or** rebuild kanban-only from the latest export: `node Scripts/jira-kanban-status-from-export.js` (no API call).  
   - Outputs include `PA/Jira/PA-Jira-mm-dd-yyyy-json.json`, `PA/Jira/pa-kanban-jira-status.json`, and `PA/Jira/pa-kanban-jira-status.js` (embedded snapshot for `file://`).

2. **Read the WBS** (`PA/PA-WSB.md`) — especially **Systems of record and planning views**, outcome table, and any POC / Jira language. Decide:  
   - Does Jira require a **WBS edit** (new change log line, clarification, or removal of obsolete wording)?  
   - Is **reclassification** needed (e.g. `[POC]` on the POC story, explicit “not a twelfth outcome”)?

3. **Update `PA/PA-WSB.md` when artifacts change**  
   - Add a **Change log** bullet under systems of record (or equivalent) with **date**, what changed, and why (e.g. removed static POC pseudo-deliverables; kanban subtasks from export).  
   - Keep **v1.x** and classification lines consistent if the user maintains version stamps.

4. **Update `PA/PA-Outcome-map.html`** (if Jira/WBS messaging changed)  
   - Subtitle: capability, epic range, action-items epic, POC story key + `[POC]` if relevant.  
   - **Planning assumptions**: authoritative backlog, FTE, POC band = active engineering (not buffer), Jira keys.  
   - POC swimlane tooltip / `detail` text: align with WBS + Jira (e.g. WSA-3719, `[POC]`).  
   - Footer / title: optional **PA-WSB v** stamp to match the WBS.

5. **Update `PA/PA-kanban.html`**  
   - **Intro** paragraph: Jira keys, POC story, `[POC]`, action-items epic, legacy epic note—match WBS/pa.mdc.  
   - **`outcomeData`**: Remove or empty planning-only rows when Jira owns that work (e.g. `POC.deliverables: []` with a **short comment** in the script pointing to the WBS change log).  
   - **POC board**: Ensure **Story WSA-3719** appears from `by_epic_key` / export (see `POC_PIPELINE_STORY_KEY` and `findPocPipelineStoryRow`). Avoid **`var` inside functions** where a later `const` with the same name exists in the same function (hoisting bug).  
   - **Kanban JSON**: `Scripts/jira-export-pa.js` attaches **`subtasks[]`** to each Story in `buildKanbanJiraStatusJson` (Sub-tasks indexed by parent). Cards show **progress** (done/total, segments or bar, %) and **Subtask checklist** from export; WBS-only subtasks remain as local checklist when no Jira rows.  
   - After script changes, **re-run** export or `jira-kanban-status-from-export.js` and commit updated `pa-kanban-jira-status.*`.

6. **Validate**  
   - Open `PA-kanban.html` in a browser: outcome grid renders (no silent JS syntax errors).  
   - `#POC` shows the pipeline POC story with Jira-linked subtasks when the export includes them.

7. **Git**  
   - Commit related changes together with a clear message; remind the user to **push to GitHub**.

### Files touched in Pattern B (typical)

| Area | Files |
|------|--------|
| WBS | `PA/PA-WSB.md` |
| Maps | `PA/PA-Outcome-map.html` |
| Kanban UI | `PA/PA-kanban.html` |
| Jira export / kanban data | `Scripts/jira-export-pa.js`, `Scripts/jira-kanban-status-from-export.js`, `PA/Jira/pa-kanban-jira-status.json`, `PA/Jira/pa-kanban-jira-status.js`, optional dated `PA/Jira/PA-Jira-*-json.json` |
| Rules / docs | `.cursor/rules/pa.mdc`, `PA/Jira/README.md` (optional) |

### When Pattern A and B overlap

If **Input** contains stakeholder docs that **change outcomes** while **Jira** already has epics/stories, run **Pattern A** for WBS content, then **Pattern B** to align HTML and exports—or do B after A so planning HTML and `pa-kanban-jira-status` reflect the new WBS narrative and current Jira.

---

## Reference

- Pattern A (detailed): [Documentation/WBS-Update-Pattern.md](../../../Documentation/WBS-Update-Pattern.md)  
- PA Jira export: [PA/Jira/README.md](../../../PA/Jira/README.md)  
- PA rules: [.cursor/rules/pa.mdc](../../rules/pa.mdc)
