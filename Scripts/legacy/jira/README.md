# Legacy Jira CLI wrappers (optional)

**Not** part of the default **Input → WBS** workflow. These thin scripts forward to [dynamo-os](https://github.com/DynamoLLC-Hub/dynamo-os) `planning-toolkit` Jira subcommands. Use only if you still need Atlassian Jira import/export; see [Documentation/legacy/](../../../Documentation/legacy/README.md) for process docs that used to be linked from the removed agent skill.

| File | Forwards to (example) |
|------|------------------------|
| `jira-export-pa.js` | `dynamo-plan jira export …` |
| `jira-export-wb.js` | `jira export` for WB |
| `jira-kanban-status-from-export.js` | `dynamo-plan jira kanban-rebuild` |
| `jira-delete-under-root.js` | `dynamo-plan jira delete-under-root` |
| `jira-delete-issue-tree.js` | `dynamo-plan jira delete-tree` |
| `jira-import-wm.js` | `dynamo-plan jira import-wm` |
| `jira-link-wm-action-items.js` | `dynamo-plan jira link-wm-action-items` |
| `wm-wsb-to-jira-import.js` | Regenerates WM `*-WBS-Load-Snapshot.json` (filename from toolkit) |

**Run from project root** (sibling `dynamo-os` or set `DYNAMO_PLAN_CLI`):

```bash
node Scripts/legacy/jira/jira-export-pa.js
# or the CLI directly:
node ../dynamo-os/planning-toolkit/bin/cli.js jira export
```

**Credentials:** `JIRA_URL`, `JIRA_USERNAME`, `JIRA_API_TOKEN` (e.g. via `dynamo-os.config.cjs` `jira.envFile`).

`package.json` no longer defines `plan:jira:*` scripts; use the CLI or these wrappers.
