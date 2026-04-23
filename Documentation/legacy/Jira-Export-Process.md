# Jira Export Process

> **Legacy / not the default WBS path.** This repo’s standard flow is **Input → WBS** — see [WBS-Update-Pattern.md](../WBS-Update-Pattern.md). For the index of legacy Jira docs, see [README.md](README.md).

This document describes the reusable process for exporting a capability's full hierarchy from Jira into the repo (e.g. **"Export PA WSA-2656 from Jira"**).

## Purpose

Export from Jira **all work items associated with a capability root**: the root issue, all Epics (children), all Stories (children of Epics), all Sub-tasks (children of Stories), and all Action Items (children of the capability's action-item root). Output is written to **`{Capability}/Jira/{Prefix}-Jira-mm-dd-yyyy-json.json`**.

## Trigger

Use the phrase **"Export PA WSA-2656 from Jira"** or **"Export PA from Jira"** (if you still use Jira), then run the export via **dynamo-os** CLI or [`Scripts/legacy/jira/jira-export-pa.js`](../../Scripts/legacy/jira/jira-export-pa.js).

## Script

**Script:** [Scripts/legacy/jira/jira-export-pa.js](../../Scripts/legacy/jira/jira-export-pa.js)

**From project root:**

```bash
node Scripts/legacy/jira/jira-export-pa.js [capability] [rootKey] [actionItemRoot]
```

| Args | Meaning |
|------|--------|
| (none) | PA, WSA-2656, WSA-2657 |
| `PA` | Same |
| `PA WSA-2656` | PA, root WSA-2656, default action-item root |
| `PA WSA-2656 WSA-2657` | Explicit roots |

Configured capabilities and default roots are in the script (`CAPABILITY_CONFIG`). Add VI, WM, etc. there as needed.

## Output

- **Location:** `{Capability}/Jira/` — for **PA/VI/WM** this is **`WSA/{Capability}/Jira/`** (e.g. `WSA/PA/Jira/`, **created** when you run an export; not required to exist in git).
- **Filename:** `{Prefix}-Jira-mm-dd-yyyy-json.json` (e.g. `PA-Jira-03-17-2026-json.json`).
- **Contents:** Metadata, full Jira issue objects (capability, action_item_root, epics, stories, subtasks, action_items), and flat lists **work_items** and **action_items_flat** in the same shape as the WSB Jira-Import format.

## Requirements

- Jira credentials: `JIRA_URL`, `JIRA_USERNAME`, `JIRA_API_TOKEN` in the environment or in `.cursor/.env`.

## See also

- [JQL-Capability-Hierarchy](JQL-Capability-Hierarchy.md) — JQL for root + Epics, root + Epics + action items, and full tree via export script (e.g. WSA-508)
- [Jira-Json-Import](Jira-Json-Import.md) — full JSON structure, flat lists, and import workflow
- [WSA/PA/README.md](../../WSA/PA/README.md) — PA folder layout; see **Jira (optional, legacy)** for export note
- [Scripts/README.md](../../Scripts/README.md) — WBS and legacy Jira shims
