# DMSI operational readiness — planning repository

Static planning artifacts (WBS, outcome maps, capability map, Gantt), Jira export/import workflows, and GitHub Actions deploy for the **Capability Map** Lambda bundle.

## Repository layout

Clone this repo **next to** [dynamo-os](https://github.com/DynamoLLC-Hub/dynamo-os) so `package.json` can resolve the local toolkit:

```text
One80Labs/
├── DMSI-Op-Readiness-II-Plan/   ← this repo
└── dynamo-os/                   ← sibling: dynamo-os/planning-toolkit
```

If your folders differ, adjust the `file:` path in `package.json` or set **`DYNAMO_PLAN_CLI`** to the absolute path of `dynamo-os/planning-toolkit/bin/cli.js` (see [Scripts/README.md](Scripts/README.md)).

### In this repository (at a glance)

Top-level: `WSA/` (workstream A capabilities: PA, VI, WM), `WSB-WSC/` (incl. WB), `Project-Plan/` (Gantt, capability map, milestones), `Scripts/`, `Documentation/`, `Requirements/`, [`.cursor/`](.cursor/) (AI rules and skills), [AGENTS.md](AGENTS.md) (rule/skill index for humans and agents).

**Full tree:** [Documentation/Project-Structure.md](Documentation/Project-Structure.md) · [Documentation/Project-Plan-Design-System.md](Documentation/Project-Plan-Design-System.md) (outcome-based HTML spec).

## Quick start

```bash
cd DMSI-Op-Readiness-II-Plan
npm install
npm run plan:validate
npm run validate
```

- **`npm run validate`** — Config validation plus JSON parse checks on key planning files (see [Scripts/validate-plan-artifacts.js](Scripts/validate-plan-artifacts.js)).
- **`npm run plan:*`** — Wrappers around **`dynamo-plan`**. Pass CLI args after `--`, e.g. `npm run plan:wbs:prep -- PA`.

More detail: [Documentation/Project-Structure.md](Documentation/Project-Structure.md) (full layout), [Scripts/README.md](Scripts/README.md) (scripts and CLI), [AGENTS.md](AGENTS.md) (Cursor rules and skills).

**Reminder:** Commit and push to GitHub regularly so the remote stays aligned with your working copy.
