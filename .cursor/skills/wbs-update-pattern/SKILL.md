---
name: wbs-update-pattern
description: Runs the WBS update process for a capability (PA, VI, WM): run prep script to archive WBS and Jira-import JSON, then load and process all files from the capability's Input folder to regenerate the WBS and report. Use when the user asks to import the latest WBS information, load WBS from Input, run a WBS load, or import/update WBS for a capability (e.g. "Import the latest PA WBS information", "Load PA from Input", "Run WBS load for VI").
---

# WBS Update Pattern

When the user asks to **import the latest [capability] WBS information** (or similar), they mean: load everything from that capability's **Input** folder and follow the full WBS update process. Apply this skill for phrases like "Import the latest PA WBS information", "Load PA WBS from Input", "Run WBS load for VI", "Import that latest PA WBS information".

## 1. Identify the capability

From the user's message, determine the capability: **PA**, **VI**, or **WM**. If unclear, ask.

## 2. Run the prep script

From the **project root**:

```bash
node Scripts/wbs-load-prep.js <capability>
```

Example for PA: `node Scripts/wbs-load-prep.js PA`

This archives the current WBS to `{Folder}/Archive/{Prefix}-WSB-mm-dd-yyyy.md`, archives the Jira-import JSON to `{Folder}/Output/Archive/...` (if present), and creates `{Folder}/Update-Reports/WBS-Load-mm-dd-yyyy.md` with a stub. Note the run date (mm-dd-yyyy); you will use it when moving Input to Archive (step 4).

## 3. Review Input and regenerate WBS

- **Read** all files in `{Capability}/Input/` (e.g. `PA/Input/`). Process **each file** explicitly.
- **For each file** in Input: extract key content (outcomes, deliverables, phases, risks, decisions, questions, timeline, tables). Either (1) add or update the WBS with new or changed items (preserving keys and structure per `.cursor/rules/{capability}.mdc`), or (2) document the mapping from that content to existing WBS keys (e.g. "Brief timeline maps to PA-OC-01–09; no new outcomes").
- **Compare** with the current WBS (`{Capability}/{Prefix}-WSB.md`) and any constraint-vs-outcome and outcome maps. **Regenerate** the WBS so it reflects the updated content from Input. Preserve: document and key structure, section order, outcome map table, per-outcome template, Risks table (Type 1/Type 2 where applicable), Decisions table, Open Questions.
- **Fill the report section "Input files processed"** with a per-file summary: for each Input file, state the filename, what was extracted (e.g. outcomes, phases, risks, decisions, timeline), and what WBS changes were made (e.g. "Added PA-OC-X", "Updated PA-R-X2") or the mapping to existing keys (e.g. "Mapped to existing PA-OC-01 through PA-OC-09; no WBS edit."). Do not leave this section generic; the user must see that each Input file was read and processed.
- **Fill in** the rest of the WBS-Load report: outcome map / constraint map changes, risks/decisions/questions changes, keys added/updated/removed, other substantial changes.

## 4. Move processed Input to Archive

After filling the report, move the processed Input files to Input/Archive so they are marked as processed. From the **project root**, run:

```bash
node Scripts/wbs-move-input-to-archive.js <capability> <dateStamp>
```

Use the same **dateStamp** as the WBS-Load report (e.g. today in mm-dd-yyyy, or read it from the report filename `WBS-Load-mm-dd-yyyy.md`). This moves all files from `{Capability}/Input/` to `{Capability}/Input/Archive/{dateStamp}/`.

## 5. Jira import JSON (manual reminder)

After the WBS is regenerated, remind the user (or assist) to update `{Capability}/Output/{Prefix}-WSB-Jira-Import.json` from the new WBS. Until a generator exists, this is manual. The JSON must keep the existing schema (`metadata`, `work_items`, `action_items`) and WBS keys (`outcome_id`, `item_id`).

## Reference

Full process, folder layout, and flow diagrams: [Documentation/WBS-Update-Pattern.md](../../../Documentation/WBS-Update-Pattern.md) in this repo.
