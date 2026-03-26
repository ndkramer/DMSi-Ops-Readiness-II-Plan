# WSA — Workstream A capability folders

**WSA** groups the three Workstream A capabilities at the repository root:

| Folder | Capability | Normative WBS |
|--------|------------|---------------|
| **`PA/`** | Pipeline Automation | `PA-WBS.md` |
| **`VI/`** | Visibility Infrastructure & Proactive Detection | `VI-WBS.md` |
| **`WM/`** | Work Management | `WM-WBS.md` |

Scripts resolve these paths via **`Scripts/wbs-capability-folder.js`** (`node Scripts/wbs-load-prep.js PA|VI|WM`, Jira export/import, etc.). **WB** (Customer Support) stays under **`WSB-WSC/WB/`**, not under `WSA/`.

Sibling references between PA, VI, and WM use relative links (e.g. from `PA/`, `../VI/README.md`). Links to **`Project-Plan/`**, **`Documentation/`**, and **`Scripts/`** go up two levels (`../../`).
