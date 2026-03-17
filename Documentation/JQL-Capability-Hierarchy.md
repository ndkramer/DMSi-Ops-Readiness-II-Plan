# JQL for Capability Full Work Hierarchy

This document gives JQL queries and the export-script approach for retrieving all work under a capability root (e.g. **WSA-508**): Epics, Stories, Sub-tasks, and Action Items.

## Hierarchy in this project

- **Capability root** (e.g. WSA-508 for VI). Direct children are **Epics**.
- **Epics** → **Stories** (parent = Epic key).
- **Stories** → **Sub-tasks** (parent = Story key).
- **Action items** live under a **separate** action-item root (e.g. WSA-509 for VI).

Configured roots are in [Scripts/jira-export-pa.js](../Scripts/jira-export-pa.js) (`CAPABILITY_CONFIG`):

| Capability | Root key   | Action-item root |
|-----------|------------|-------------------|
| PA        | WSA-2656   | WSA-2657          |
| VI        | WSA-508    | WSA-509           |
| WM        | WSA-2881   | WSA-2882          |

## JQL limitation

Standard Jira Cloud JQL has **no** “all descendants of this issue” function. The only hierarchy function in [JQL functions](https://support.atlassian.com/jira-service-management-cloud/docs/jql-functions) is **parentEpic**, which is for Epic → Stories/Sub-tasks, not for root → Epics → Stories → Sub-tasks.

So you **cannot** get the full tree in a **single** JQL in the Jira UI with built-in JQL alone.

## JQL options

### 1. Root + direct children (Epics only)

Returns the capability root and all Epics directly under it. Does **not** include Stories, Sub-tasks, or action items.

**VI (WSA-508):**

```jql
key = WSA-508 OR parent = WSA-508
```

**Generic** (replace `ROOT_KEY` with the capability root, e.g. WSA-2656, WSA-2881):

```jql
key = ROOT_KEY OR parent = ROOT_KEY
```

### 2. Root + Epics + action items (one filter)

Use when you want the root, all Epics, and all action items for that capability in one saved filter. Stories and Sub-tasks are still not included (they sit under Epic/Story keys).

**VI (WSA-508 + WSA-509):**

```jql
key = WSA-508 OR parent = WSA-508 OR parent = WSA-509
```

**PA:** `key = WSA-2656 OR parent = WSA-2656 OR parent = WSA-2657`  
**WM:** `key = WSA-2881 OR parent = WSA-2881 OR parent = WSA-2882`

### 3. Full tree (Epics, Stories, Sub-tasks, Action items)

No single JQL returns the full tree. Use the repo’s export script, which runs multiple JQL queries and writes the full hierarchy to JSON.

**VI:**

```bash
node Scripts/jira-export-pa.js VI WSA-508 WSA-509
```

**PA:** `node Scripts/jira-export-pa.js PA WSA-2656 WSA-2657`  
**WM:** `node Scripts/jira-export-pa.js WM WSA-2881 WSA-2882`

Output: `{Capability}/Jira/{Prefix}-Jira-mm-dd-yyyy-json.json` (see [Jira-Export-Process.md](Jira-Export-Process.md)).

### 4. Delete all under root (leave root and action-item root)

To **delete** all Epics, Stories, Sub-tasks, and Action Items under a capability (e.g. WSA-508) while keeping the root and action-item root, use [Scripts/jira-delete-under-root.js](../Scripts/jira-delete-under-root.js). Run with `--dry-run` first to see counts and confirm.

**VI:**

```bash
node Scripts/jira-delete-under-root.js VI --dry-run   # preview
node Scripts/jira-delete-under-root.js VI             # delete
```

**PA:** `node Scripts/jira-delete-under-root.js PA`  
**WM:** `node Scripts/jira-delete-under-root.js WM`

## Summary

| Goal                               | JQL / approach                                                                 |
|------------------------------------|---------------------------------------------------------------------------------|
| Root + Epics under WSA-508         | `key = WSA-508 OR parent = WSA-508`                                            |
| Root + Epics + VI action items    | `key = WSA-508 OR parent = WSA-508 OR parent = WSA-509`                         |
| Full tree (all types)              | No single JQL; use **export script**: `node Scripts/jira-export-pa.js VI WSA-508 WSA-509` |

If your Jira has an app (e.g. JQL Search Extensions) that adds recursive hierarchy functions, you may be able to use something like `issue in childIssuesOf("WSA-508")` in the UI; that is not standard JQL.

## See also

- [Jira-Export-Process.md](Jira-Export-Process.md) — export script usage and output
- [Scripts/jira-export-pa.js](../Scripts/jira-export-pa.js) — export implementation (multiple `parent = …` JQL calls)
- [Scripts/jira-delete-under-root.js](../Scripts/jira-delete-under-root.js) — delete all work under a root (use `--dry-run` first)
