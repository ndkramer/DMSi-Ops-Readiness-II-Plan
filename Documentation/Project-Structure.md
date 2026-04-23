# Project file structure

Snapshot of the **DMSI-OP-Readiness-OS** repository layout. Folders end with `/`.

**Generated:** 2026-04-23

**Omitted from this listing**

- `.git/` (version control metadata)
- `.cursor/.env` if present (local secrets; not listed)
- `.cursor/mcp.json` if present (local MCP; may contain tokens; not listed)

---

```

DMSI-OP-Readiness-OS/
├── .cursor/
│   ├── rules/
│   │   ├── agent-run-terminal.mdc
│   │   ├── one-step-user-instructions.mdc
│   │   ├── pa.mdc
│   │   ├── project-plan.mdc
│   │   ├── vi.mdc
│   │   ├── wb.mdc
│   │   └── wm.mdc
│   └── skills/
│       ├── jira-export/
│       │   └── SKILL.md
│       └── wbs-update-pattern/
│           ├── reference.md
│           └── SKILL.md
├── .cursorignore
├── .github/
│   └── workflows/
│       └── deploy-capability-map.yml
├── AGENTS.md
├── README.md
├── .cursorrules
├── Documentation/
│   ├── Capacity-Map-Target-Date-Updates.md
│   ├── dynamo_os_architecture_v4.svg
│   ├── dynamo_os_definitions.docx
│   ├── Jira-Export-Process.md
│   ├── Jira-Json-Import.md
│   ├── JQL-Capability-Hierarchy.md
│   ├── Project-Plan-Design-System.md
│   ├── Project-Structure.md
│   └── WBS-Update-Pattern.md
├── Project-Plan/
│   ├── Archive/
│   │   └── Combined-Outcome-Gantt.html
│   ├── Capability-map/
│   │   ├── archive/
│   │   │   ├── README.md
│   │   │   └── legacy-2026-04-21/
│   │   │       ├── README.md
│   │   │       ├── capability-map-archive-duplicate/
│   │   │       └── root-archive/
│   │   ├── MOVED-Capability-map-archive.txt
│   │   ├── README-Lambda-Deploy.md
│   │   ├── capability-map-artifacts-dmsi.json
│   │   ├── capability-map-dmsi.html
│   │   ├── capability-map-state.json
│   │   ├── capability-map.html
│   │   ├── index.mjs
│   │   ├── sync-capability-status-from-github.mjs
│   │   ├── sync-dmsi-embedded-from-state.mjs
│   │   ├── sync-stage-dates-from-outcome-maps.js
│   │   ├── Sprint Calendar.csv
│   │   └── ...
│   ├── .DS_Store
│   ├── build-gantt-data.js
│   ├── Combined-Outcome-Gantt.html
│   ├── gantt-data.json
│   ├── Milestones/
│   │   ├── milestone_capability_xref.html
│   │   ├── milestones.html
│   │   └── project-milestones.json
│   ├── README-build-gantt.md
│   ├── reference-doc-Customer-Support-Implementation-Plan.docx
│   └── Workstream-A-Implementation-Plan.docx
├── Requirements/
│   ├── Dynamo-os-prd.md
│   ├── PP-Constraint-vs-Outcome-Map.html
│   ├── PRD-dmsi-project-planning-prd.md
│   ├── project-plan-build-prompt.md
│   └── wbs-to-html_dynamic_data_e3d6bcc5.plan.md
├── Scripts/
│   ├── jira-delete-issue-tree.js
│   ├── jira-delete-under-root.js
│   ├── jira-export-pa.js
│   ├── jira-export-wb.js
│   ├── jira-import-wm.js
│   ├── jira-kanban-status-from-export.js
│   ├── jira-link-wm-action-items.js
│   ├── sync-outcome-map-fallbacks.js
│   ├── sync-outcome-stall-overlay.js
│   ├── README.md
│   ├── planning-path-context.js
│   ├── validate-plan-artifacts.js
│   ├── wbs-capability-folder.js
│   ├── wbs-load-prep.js
│   ├── wbs-load-report-counts.js
│   ├── wbs-move-input-to-archive.js
│   └── wm-wsb-to-jira-import.js
├── WSA/
│   ├── PA/
│   │   ├── Archive/
│   │   │   └── PA-WBS-03-17-2026.md
│   │   ├── Input/
│   │   │   └── Archive/
│   │   │       └── 03-17-2026/
│   │   │           ├── DMSi_AWS_Runners_Executive_Brief.md
│   │   │           └── DMSi_AWS_Self_Hosted_GitHub_Runners_Spec.md
│   │   ├── Jira/
│   │   │   ├── PA-Jira-03-17-2026-json.json
│   │   │   ├── PA-Jira-03-23-2026-json.json
│   │   │   ├── PA-Jira-03-24-2026-json.json
│   │   │   ├── pa-kanban-jira-status.js
│   │   │   ├── pa-kanban-jira-status.json
│   │   │   └── README.md
│   │   ├── Output/
│   │   │   ├── Archive/
│   │   │   │   └── PA-WBS-Jira-Import-03-17-2026.json
│   │   │   └── PA-WBS-Jira-Import.json
│   │   ├── Update-Reports/
│   │   │   └── WBS-Load-03-17-2026.md
│   │   ├── .DS_Store
│   │   ├── PA-Constraint-vs-Outcome-Map.html
│   │   ├── PA-kanban.html
│   │   ├── PA-Outcome-map.html
│   │   ├── pa-outcomes.json
│   │   ├── PA-WBS.md
│   │   └── README.md
│   ├── VI/
│   │   ├── Archive/
│   │   │   └── VI-WBS-03-17-2026.md
│   │   ├── Jira/
│   │   │   ├── README.md
│   │   │   └── VI-Jira-03-17-2026-json.json
│   │   ├── Output/
│   │   │   ├── Archive/
│   │   │   │   └── VI-WBS-Jira-Import-03-17-2026.json
│   │   │   ├── .DS_Store
│   │   │   └── VI-WBS-Jira-Import.json
│   │   ├── Update-Reports/
│   │   │   └── WBS-Load-03-17-2026.md
│   │   ├── .DS_Store
│   │   ├── README.md
│   │   ├── VI-Constraint-vs-Outcome-Map 2.html
│   │   ├── VI-Constraint-vs-Outcome-Map.html
│   │   ├── VI-kanban.html
│   │   ├── vi-outcomes.json
│   │   ├── VI-WBS.md
│   │   └── VI-WSB-Outcome-Map.html
│   ├── WM/
│   │   ├── Jira/
│   │   │   ├── README.md
│   │   │   └── WM-Jira-03-17-2026-json.json
│   │   ├── Output/
│   │   │   ├── Archive/
│   │   │   └── WM-WBS-Jira-Import.json
│   │   ├── compare-models.md
│   │   ├── README.md
│   │   ├── WM-Constraint-vs-Outcome-Map.html
│   │   ├── WM-kanban.html
│   │   ├── WM-Outcome-Map.html
│   │   ├── wm-outcomes.json
│   │   └── WM-WBS.md
│   └── README.md
├── WSB-WSC/
│   ├── Outcome/
│   │   └── WSB-WSC-Outcome-Map.html
│   ├── WB/
│   │   ├── Archive/
│   │   │   ├── .gitkeep
│   │   │   └── WB-WBS-03-26-2026.md
│   │   ├── Input/
│   │   │   └── .gitkeep
│   │   ├── Jira/
│   │   │   ├── .gitkeep
│   │   │   └── README.md
│   │   ├── Output/
│   │   │   ├── Archive/
│   │   │   │   ├── .gitkeep
│   │   │   │   └── WB-WBS-Jira-Import-03-26-2026.json
│   │   │   └── WB-WBS-Jira-Import.json
│   │   ├── Update-Reports/
│   │   │   ├── .gitkeep
│   │   │   └── WBS-Load-03-26-2026.md
│   │   ├── Customer Support Implementation Plan.docx
│   │   ├── README.md
│   │   ├── WB-kanban.html
│   │   ├── WB-Outcome-Map.html
│   │   ├── wb-outcomes.json
│   │   └── WB-WBS.md
│   ├── .DS_Store
│   ├── Outcome_Based_Project_Model.md
│   └── WSB-WSC-Outcome-Map.html
├── .DS_Store
└── .gitignore

```

## Regenerating this document

From the repository root, you can print an updated tree with:

```bash
python3 << 'PY'
import os
ROOT = "."
SKIP_DIRS = {".git", "__pycache__", "node_modules"}
SKIP_NAMES = {".env"}

def walk(dirpath, prefix="", depth=0, max_depth=25):
    if depth > max_depth:
        return
    try:
        names = sorted(os.listdir(dirpath), key=lambda s: (not os.path.isdir(os.path.join(dirpath, s)), s.lower()))
    except PermissionError:
        return
    dirs, files = [], []
    for name in names:
        if name in SKIP_NAMES:
            continue
        full = os.path.join(dirpath, name)
        rel = os.path.relpath(full, ROOT)
        if name == ".git" or rel.startswith(".git" + os.sep):
            continue
        if os.path.isdir(full):
            if name in SKIP_DIRS:
                continue
            dirs.append(name)
        else:
            files.append(name)
    entries = [(d, True) for d in dirs] + [(f, False) for f in files]
    for i, (name, is_dir) in enumerate(entries):
        last = i == len(entries) - 1
        branch = "└── " if last else "├── "
        print(prefix + branch + name + ("/" if is_dir else ""))
        if is_dir:
            ext = "    " if last else "│   "
            walk(os.path.join(dirpath, name), prefix + ext, depth + 1, max_depth)

print("DMSI-OP-Readiness-OS/")
walk(ROOT, "", 0)
PY
```

Paste the output into the fenced block above and adjust the **Generated** date.
