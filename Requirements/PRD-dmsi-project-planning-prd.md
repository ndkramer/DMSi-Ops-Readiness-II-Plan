# DMSi Project Planning – Product Requirements Document

**Version:** 1.0  
**Date:** March 15, 2026  
**Author:** Nick Kramer  
**Status:** Draft

---

## 1. Overview

DMSi Project Planning is an internal project management tool that transforms Work Breakdown Structure (WBS) markdown documents into dynamic, visual project plans. The system aggregates data from three sources -- WBS markdown files, GitHub Projects, and a custom admin interface -- and renders predefined project management visuals that are embedded directly into Confluence pages.

---

## 2. Goals

- Provide a single source of truth for project planning data derived from WBS documents
- Automatically reflect GitHub Projects status updates in project visuals
- Give the admin a lightweight interface to supplement data not available from WBS or GitHub Projects
- Embed all visuals in Confluence so stakeholders access them without leaving their existing workflow

---

## 3. Users

| Role | Description |
|------|-------------|
| **Admin** | Single user responsible for maintaining WBS docs, updating GitHub Projects, and entering supplemental data via the custom interface |
| **Viewer** | Any team member or stakeholder who views the visuals on Confluence |

---

## 4. Data Sources

### 4.1 WBS Markdown Files
- Primary data source for the project plan
- Stored in the GitHub repo as `.md` files (in the planning workspace these may be organized by capability: **PA** Pipeline Automation, **VI** Visibility Infrastructure, **WM** Work Management, with combined plan docs in **Project-Plan**)
- Contains project structure, tasks, deliverables, dependencies, resources, and milestones
- On push to main, a GitHub Actions workflow parses the markdown and converts it to JSON

### 4.2 GitHub Projects
- Source of truth for task status and progress tracking
- GitHub Actions workflow syncs GitHub Projects data to a status JSON file on a schedule or on project update
- Status data is merged with WBS data to produce the final project JSON

### 4.3 Custom Admin Interface
- A Lambda-served HTML page accessible to the admin only
- Allows the admin to add or update data not available from WBS or GitHub Projects (e.g. commentary, external dependencies, risk flags, custom dates)
- Data is saved as JSON in the repo via the GitHub API and triggers a redeploy

---

## 5. Data Architecture

All data is stored as JSON files in the GitHub repo and served by Lambda. There is no database.

| File | Source | Description |
|------|--------|-------------|
| `wbs-data.json` | Parsed from WBS markdown | Tasks, hierarchy, resources, milestones, dependencies |
| `status-data.json` | Synced from GitHub Projects | Task status, assignees, progress |
| `custom-data.json` | Admin interface | Supplemental data not available from other sources |
| `project-plan.json` | Merged at deploy time | Combined output used by all visuals |

### 5.1 Resolved Decisions (March 2026)

| Decision | Choice |
|----------|--------|
| **Repo** | All current docs and code move to a **new repo** `dmsi-project-planning`; no separate "planning" repo for runtime. |
| **GitHub Project** | **One** GitHub Project for the whole initiative (all capabilities PP, VI, WM together). |
| **WBS ↔ Projects linkage** | Every Project item has a **key in the title** (e.g. `OC-04.1`, `OC-04`) so status sync can match items to WBS nodes when building `status-data.json`. |
| **Visuals** | Use **existing** outcome maps, kanban, and combined Gantt first; may add new visuals (Critical Path, Resource Allocation, Milestone Tracker, etc.) later. |
| **Deploy** | Merge runs in **GitHub Actions** (on push); `project-plan.json` is committed. Deploy zips repo (including that JSON) to Lambda. Lambda serves pre-built files only; it does not run parser or merge. |

### 5.2 Merge Strategy (Best Practice)

Merge combines `wbs-data.json` + `status-data.json` + `custom-data.json` into `project-plan.json`. Recommended approach:

- **WBS as backbone**: Start from the parsed WBS structure (outcomes, deliverables, hierarchy).
- **Join by stable ID**: Every WBS node has a stable id (e.g. `OC-04`, `OC-04.1`). `status-data.json` and `custom-data.json` use the same id as the key (or a field like `wbsId`) so the merge can attach status and custom fields to the correct node.
- **Output shape**: Either (a) **single list of work items** where each item has `id`, `title`, `status`, `assignees`, `customCommentary`, etc., or (b) **nested** `{ wbs: {...}, status: { [id]: {...} }, custom: { [id]: {...} }` so visuals look up by id. Option (a) is simpler for visuals that iterate over one list; option (b) keeps sources explicit. Choose one and document it so all visuals and the merge script stay in sync.

### 5.3 Custom Data (TBD)

The exact fields for `custom-data.json` (and the admin UI) are not yet defined. Keep the schema flexible (e.g. key-value by WBS id, or a small set of optional fields added later) until use cases are clear.

---

## 6. System Architecture

### 6.1 Infrastructure
- **GitHub Repo:** `dmsi-project-planning` (new, dedicated repo)
- **Lambda Function:** `project-planning` (Node.js 22.x, us-east-2)
- **Lambda Function URL:** Public HTTPS URL, no auth (internal use only)
- **GitHub Actions:** Handles all deployment and data sync automation

### 6.2 Data Flow

```
WBS Markdown Files  ──┐
                       ├──► GitHub Actions ──► Merged JSON ──► Lambda ──► Confluence iframes
GitHub Projects    ──┤
                       │
Custom Admin UI    ──┘
```

### 6.3 Lambda Responsibilities
- Serve HTML visual pages by path (e.g. `/gantt.html`)
- Serve JSON data files by path (e.g. `/project-plan.json`)
- All files served as static assets from the Lambda deployment package

### 6.4 GitHub Actions Workflows
| Workflow | Trigger | Action |
|----------|---------|--------|
| `deploy.yml` | Push to main | Zips all files, deploys to Lambda |
| `sync-github-projects.yml` | Scheduled + manual | Fetches GitHub Projects data, updates `status-data.json`, commits, pushes |
| `merge-data.yml` | On push | Merges WBS, status, and custom JSON into `project-plan.json` |

---

## 7. Visuals

All visuals are pre-built HTML/CSS/JS files served by Lambda and embedded in Confluence via iframe macros.

| Visual | File | Data Source |
|--------|------|-------------|
| Gantt Chart | `gantt.html` | `project-plan.json` |
| WBS Visual | `wbs.html` | `project-plan.json` |
| Status Dashboard | `status-dashboard.html` | `project-plan.json` |
| Critical Path | `critical-path.html` | `project-plan.json` |
| Resource Allocation | `resource-allocation.html` | `project-plan.json` |
| Milestone Tracker | `milestone-tracker.html` | `project-plan.json` |

---

## 8. Custom Admin Interface

- Served by Lambda at `/admin.html`
- Single-user, no authentication required (internal use)
- Allows the admin to add and edit supplemental project data
- On save, writes updated `custom-data.json` to the repo via the GitHub API
- GitHub Actions automatically redeploys Lambda with the updated data

---

## 9. Confluence Integration

- Each visual is embedded on a dedicated Confluence page using the built-in iframe macro
- iframe settings: width `100%`, height tuned per visual, frameborder hidden
- No Forge app required

---

## 10. Repo Structure

```
dmsi-project-planning/
├── .github/
│   └── workflows/
│       ├── deploy.yml
│       ├── sync-github-projects.yml
│       └── merge-data.yml
├── data/
│   ├── wbs-data.md          # Source WBS document(s)
│   ├── wbs-data.json        # Parsed from markdown
│   ├── status-data.json     # Synced from GitHub Projects
│   ├── custom-data.json     # Admin-entered data
│   └── project-plan.json    # Merged output
├── visuals/
│   ├── gantt.html
│   ├── wbs.html
│   ├── status-dashboard.html
│   ├── critical-path.html
│   ├── resource-allocation.html
│   └── milestone-tracker.html
├── admin/
│   └── admin.html
└── index.mjs                # Lambda handler
```

### 10.1 Planning workspace folder layout (source)

In the planning workspace, WBS and visuals are organized by capability. The parser (and CI) read from these folders to produce the `data/` artifacts used in the repo above:

| Folder | Purpose |
|--------|---------|
| **Project-Plan** | Combined project plan docs and visuals (e.g. combined Gantt). |
| **PA** | Pipeline Automation: WBS markdown (e.g. `PP-WSB.md`), outcome maps, kanban. |
| **VI** | Visibility Infrastructure: WBS markdown (e.g. `VI-WBS.md`), outcome maps, kanban. |
| **WM** | Work Management: WBS markdown (e.g. `WM-WBS.md`), outcome maps, kanban. |

Parsed output (e.g. `wbs-data.json`) and merged `project-plan.json` live in the target repo’s `data/` directory; the deploy package does not duplicate the planning workspace folder names.

---

## 11. Open Items

| Item | Notes |
|------|-------|
| WBS markdown schema | Define standard structure so parser is consistent (current WBS format in plan doc is the starting point) |
| GitHub Projects sync | Field mapping: status, assignees; match items to WBS by **key in title** (e.g. OC-04.1). One Project for all capabilities. |
| Custom data fields | TBD; keep schema flexible until use cases are clear |
| Visual designs | Use existing outcome maps, kanban, combined Gantt; new visuals (Critical Path, Resource Allocation, Milestone Tracker) may be added later |
| Admin interface auth | Currently no auth -- confirm acceptable for internal use |
| Merge output shape | Decide: single list of work items (id, title, status, custom...) vs nested wbs/status/custom by id; document for visuals |
