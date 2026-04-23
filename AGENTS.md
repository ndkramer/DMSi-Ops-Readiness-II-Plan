# Agent and contributor map — DMSI Op Readiness planning repo

This repository holds static planning artifacts (WBS, outcome maps, Gantt, capability map), Jira import/export flows, and GitHub Actions for the **Capability Map** deploy. The planning CLI lives in a **sibling** clone: [dynamo-os](https://github.com/DynamoLLC-Hub/dynamo-os) (`dynamo-os/planning-toolkit`, `dynamo-plan`).

## Where Lambdas get deployed from (important)

- **Canonica organization repo:** [DynamoLLC-Hub/DMSI-OP-Readiness-OS](https://github.com/DynamoLLC-Hub/DMSI-OP-Readiness-OS) — the **Deploy Capability Map to Lambda** job runs in **the GitHub repo that received the push**; it is not a cross-org deploy. `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `LAMBDA_FUNCTION_NAME` (and any other deploy secrets) must be defined under **that repo** → *Settings* → *Secrets and variables* → *Actions*.

- A local `origin` may point to a personal fork (e.g. `ndkramer/DMSi-Ops-Readiness-II-Plan`). Pushing a fork can deploy from the fork if secrets exist there, which is usually not what you want. To use the org remote: add `git remote add dynamo https://github.com/DynamoLLC-Hub/DMSI-OP-Readiness-OS.git` (if not present) and `git push dynamo main` after the org is created and you have access, **or** set `origin` to the org URL and use `git push origin main` only. Confirm on GitHub that Actions runs in **DynamoLLC-Hub/DMSI-OP-Readiness-OS** and that a deploy run appears there.

- **Start here (humans):** [README.md](README.md) — install, `npm run validate`, `plan:*` scripts.
- **Full repository tree (documentation):** [Documentation/Project-Structure.md](Documentation/Project-Structure.md).
- **Project plan UI spec (Gantt / maps / kanban):** [Documentation/Project-Plan-Design-System.md](Documentation/Project-Plan-Design-System.md).

## Cursor project rules (`.cursor/rules/*.mdc`)

| File | Scope |
|------|--------|
| [agent-run-terminal.mdc](.cursor/rules/agent-run-terminal.mdc) | `alwaysApply` — agent runs commands itself |
| [one-step-user-instructions.mdc](.cursor/rules/one-step-user-instructions.mdc) | `alwaysApply` — one manual step per message for UI walkthroughs |
| [pa.mdc](.cursor/rules/pa.mdc) | `WSA/PA/**` — Pipeline Automation WBS / Jira |
| [project-plan.mdc](.cursor/rules/project-plan.mdc) | `Project-Plan/**`, `WSA/**`, `WSB-WSC/**` — HTML design; see [Project-Plan-Design-System.md](Documentation/Project-Plan-Design-System.md) |
| [vi.mdc](.cursor/rules/vi.mdc) | `WSA/VI/**` — Visibility Infrastructure WBS |
| [wm.mdc](.cursor/rules/wm.mdc) | `WSA/WM/**` — Work Management WBS |
| [wb.mdc](.cursor/rules/wb.mdc) | `WSB-WSC/WB/**` — Workstream B / Customer Support WBS |

## Project skills (`.cursor/skills/`)

| Skill | When to use |
|-------|-------------|
| [jira-export](.cursor/skills/jira-export/SKILL.md) | Export a capability tree from Jira to `{Capability}/Jira/`. |
| [wbs-update-pattern](.cursor/skills/wbs-update-pattern/SKILL.md) | WBS input load, Jira–WBS–planning alignment, dependency JSON; [reference](.cursor/skills/wbs-update-pattern/reference.md) for full tables and steps. |

Do not duplicate long policy in this file — detail lives in the linked `.mdc` / `SKILL.md` files. **Reminder:** commit and push to GitHub regularly so the remote matches your working copy.
