# Jira JSON Import

> **Legacy / not the default WBS path.** See [WBS-Update-Pattern.md](../WBS-Update-Pattern.md) and [README.md](README.md).

This document describes the **Jira JSON export** artifact: what it is, its structure, how to generate it, and how it is used for comparison and import workflows alongside the WSB Jira-Import format.

## Overview

The **Jira JSON** file is a snapshot of a capability’s full hierarchy **as it exists in Jira**: capability root, Epics, Stories, Sub-tasks, and Action Items. It is produced by exporting from Jira (via the export script) and is stored under `{Capability}/Jira/`. The same JSON is the source for **Jira-Json-Import** workflows: comparing Jira state to the WSB Jira-Import (WBS-derived) file, or feeding a future import/sync process.

## File location and naming

| Item | Value |
|------|--------|
| **Folder** | `{Capability}/Jira/` — PA/VI/WM resolve under **`WSA/{Capability}/Jira/`**; WB under `WSB-WSC/WB/Jira/`. **PA:** this repo may not include `WSA/PA/Jira/` in git; running export **creates** it. |
| **Filename** | `{Prefix}-Jira-mm-dd-yyyy-json.json` (e.g. `PA-Jira-03-17-2026-json.json`) |
| **Date in name** | Export run date (`mm-dd-yyyy`) |

One file per export run; keep or archive older files as needed.

## JSON structure

The file is a single JSON object with the following top-level keys.

### metadata

Summary and identifiers for the export.

| Field | Type | Description |
|-------|------|-------------|
| `export_date` | string | Run date `mm-dd-yyyy`. |
| `capability` | string | Capability code (e.g. `PA`). |
| `capability_root_key` | string | Jira key of the capability root (e.g. `WSA-2656`). |
| `action_item_root_key` | string | Jira key of the action-item root (e.g. `WSA-2657`). |
| `counts` | object | `epics`, `stories`, `subtasks`, `action_items` (counts). |

### Raw Jira issue objects

Full issue payloads as returned by the Jira REST API (key, id, fields, etc.):

| Key | Description |
|-----|-------------|
| `capability` | The capability root issue. |
| `action_item_root` | The action-item root issue. |
| `epics` | Array of Epic issues (direct children of the capability root). |
| `stories` | Array of Story issues (children of Epics). |
| `subtasks` | Array of Sub-task issues (children of Stories). |
| `action_items` | Array of Action Item issues (children of the action-item root). |

Use these when you need full Jira fields, custom fields, or API-shaped data.

### Flat lists (import-friendly)

Two arrays match the shape used in the **WSB Jira-Import** format so you can diff or drive import logic without parsing raw Jira objects.

#### work_items

One object per **Epic**, **Story**, and **Sub-task**. Each object has:

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Jira issue key (e.g. `WSA-2668`). |
| `issue_type` | string | `"Epic"`, `"Story"`, or `"Sub-task"`. |
| `summary` | string | Issue summary. |
| `description` | string | Plain-text description (ADF converted to text). |
| `parent` | string | Parent key or parent summary (for hierarchy display). |
| `labels` | string | Comma-separated labels. |
| `owner` | string | Assignee display name. |
| `priority` | string | Priority name. |
| `outcome_id` | string | Extracted from summary (e.g. `[PA-OC-01]` → `PA-OC-01`), or empty. |
| `category` | string | Reserved for custom field / future use. |
| `target` | string | Reserved for custom field / future use. |
| `status` | string | Jira status name. |
| `component` | string | Component name(s). |

#### action_items_flat

Same flat shape as above for **Action Items**, plus:

| Field | Type | Description |
|-------|------|-------------|
| `link_to` | string | Key of the action-item root (e.g. `WSA-2657`). |
| `link_type` | string | Link type (e.g. `"Related to"`). |

Use `work_items` and `action_items_flat` when comparing to `PA-WBS-Load-Snapshot.json` (which has `work_items` and `action_items`) or when building an import/sync step.

## Relationship to the WBS load snapshot

| Artifact | Source | Purpose |
|----------|--------|---------|
| **Jira JSON** (`PA-Jira-mm-dd-yyyy-json.json`) | Export **from Jira** (this format) | Current state in Jira; input to diff/import. |
| **WBS load snapshot** (`PA-WBS-Load-Snapshot.json`) | Derived **from** [`PA-WBS.md`](../../WSA/PA/PA-WBS.md) (manual or generator) | Target state; what should be in Jira. |

- **Jira JSON** = “what Jira has.”
- **PA-WBS-Load-Snapshot** = “what the WBS says should be in Jira.” (Filename aligns with **PA-WBS.md**; VI/WM use **`VI-WBS-Load-Snapshot.json`**, **`WM-WBS-Load-Snapshot.json`**.)

Optional outcome ↔ epic registry: [`pa-outcomes.json`](../../WSA/PA/pa-outcomes.json).

Diffing `work_items` / `action_items_flat` (Jira JSON) against `work_items` / `action_items` (PA-WBS-Load-Snapshot) by key or outcome_id supports add/update/delete decisions for a future Jira import or sync process.

## How to generate the Jira JSON (export)

1. **Trigger:** Run **dynamo-os** `dynamo-plan jira export` or [`Scripts/legacy/jira/jira-export-pa.js`](../../Scripts/legacy/jira/jira-export-pa.js); for **PA** the default output directory is `WSA/PA/Jira/` (created on first export if absent).

2. **Script (from project root):**
   ```bash
   node Scripts/legacy/jira/jira-export-pa.js [capability] [rootKey] [actionItemRoot]
   ```
   Examples: `node Scripts/legacy/jira/jira-export-pa.js`, or `node Scripts/legacy/jira/jira-export-pa.js PA WSA-2656`.

3. **Requirements:** `JIRA_URL`, `JIRA_USERNAME`, `JIRA_API_TOKEN` in the environment or in `.cursor/.env`.

Details: [Jira Export Process](Jira-Export-Process.md), [WSA/PA/README.md](../../WSA/PA/README.md) (PA layout), [Scripts/README.md](../../Scripts/README.md).

## Using the Jira JSON for import workflows

- **Compare:** Diff `work_items` and `action_items_flat` (by `key` or `outcome_id`) against the WSB Jira-Import `work_items` and `action_items` to see what to add, update, or remove in Jira.
- **Audit:** Use the raw `epics`, `stories`, `subtasks`, `action_items` (or the flat lists) to report what is in Jira for a capability at export time.
- **Future import:** A separate Jira upload/sync process can consume this JSON (and the WSB Jira-Import) to compute and apply changes in Jira.

## See also

- [Jira Export Process](Jira-Export-Process.md) — How to run the export and where output goes.
- [Jira Export Process](Jira-Export-Process.md) — export output location and format.
- [WBS Update Pattern](../WBS-Update-Pattern.md) — Input → WBS (default).
- [Scripts/README.md](../../Scripts/README.md) — includes [`legacy/jira`](../../Scripts/legacy/jira/README.md).
