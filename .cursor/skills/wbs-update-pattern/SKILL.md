---
name: wbs-update-pattern
description: Two related workflows for Pipeline Automation (PA) and sibling capabilities (VI, WM, WB). (1) Input-based WBS load — run prep script, process Input folder, regenerate WBS, archive Input, report. (2) Jira–WBS–planning alignment — compare Jira export to the capability WBS and planning HTML (e.g. PA-kanban, PA-Outcome-map; WB-kanban when Jira-backed), adjust exports. **After any substantive WBS markdown edit**, prepend a dated row to that file’s end-of-document **Document Change Log** (see body). **Dependency Flow data is JSON-first:** `pa-outcomes.json` → `dependency_edges` (PA) and `wsb-wsc-outcome-dependencies.json` (WSB–WSC combined map); HTML uses `fetch` plus an embedded `#…-dependency-edges-fallback` for `file://`. Catalog `WSB-WSC/dependency-sources.yml`; deploy workflow zips dependency JSON for Lambda. Use when the user asks to import WBS from Input, OR to align WBS and planning views with Jira, refresh kanban, reconcile POC vs outcomes (PA), update dependency charts or JSON edges, or update planning artifacts after Jira changes.
---

# WBS Update Pattern

This skill covers **two** repeatable processes. Pick the one that matches the user’s goal.

| User intent | Pattern |
|-------------|---------|
| “Import latest PA WBS from Input”, “Run WBS load for VI”, load files from `{Capability}/Input/` | **A — Input → WBS** |
| “Align WBS with Jira”, “Update kanban from Jira”, “Reconcile POC / [POC] / outcomes”, refresh `PA-kanban` / `PA-Outcome-map` / `PA-WBS` after Jira | **B — Jira ↔ WBS ↔ planning HTML** |

Capability folders use prefixes **PA**, **VI**, **WM**, **WB** (Customer Support / Workstream B). Follow `.cursor/rules/{capability}.mdc` when editing that capability’s artifacts.

### Outcome map dependency flow (required pattern for planning HTML)

When creating or updating **Outcome Map** HTML that includes a **Dependency Flow** diagram (**`PA-Outcome-map.html`** is the reference; apply the same interaction model to sibling maps such as **`WSB-WSC/WSB-WSC-Outcome-Map.html`**, and to future **`VI-*-Outcome-map.html`** / **`WM-*-Outcome-map.html`** / **`WB-Outcome-map.html`** if added):

1. **SVG graph** — Outcome (or activity) nodes with **curved** edges; **must** = solid dark stroke, **should** = **dashed** green stroke, **contingent** = dashed orange. Legend must match (dashed “should” line in the legend bar).
2. **Hit targets** — Draw **visible** edges in a layer **below** node circles; draw **wide transparent** paths (`dep-edge-hit`, ~18px stroke) in a layer **above** nodes so the full arrow remains hoverable and keyboard-focusable (`tabindex="0"`).
3. **Tooltips** — On **hover** and **focus**, show the shared page tooltip (`#tooltip`) with at least: **link type**, **timing**, **prerequisite / effect**, optional **granular** bullets (WBS gates, parallel-work nuance), **decisions ahead** with **TYPE 1** / **TYPE 2** labels per that capability’s decision register (PA: PA-D-XX; VI: VI-D-XX; WM: per WM-WBS). Where the map uses **blockers** or cross-deps instead (e.g. WSB-WSC), use a **BLOCKER** or **CROSS-DEP** badge in the same list. Optional **cross-workstream** line (PA: PA-CW-XX; WSB-WSC: X-01 / X-02 narrative).
4. **Intro copy** — A short **`dep-graph-note`** under the section title defining Type 1 vs Type 2 for that capability (or pointing to the WBS § that defines them).
5. **`moveTooltip`** — Must tolerate missing `clientX`/`clientY` (keyboard); **focus** on an edge should position the tooltip via **`getBoundingClientRect`** on the focused path (same approach as `PA-Outcome-map.html`).

**`*-outcomes.json` (`schema_version` ≥ 2):** include **`dependency_edges`** as an array of objects aligned with the HTML model so scripts or future generators can stay in sync:

| Field | Purpose |
|--------|---------|
| `id` | Stable edge id (e.g. `e-01-02`) |
| `from`, `to` | Outcome or activity ids matching the map |
| `type` | `must` \| `should` \| `contingent` |
| `curve` | Optional number: perpendicular offset for quadratic curve |
| `timing` | When the dependency bites (sprints, weeks, gates) |
| `prerequisite` | What must be true because of this link |
| `decisions` | `[{ "id", "decision_type": "TYPE 1" \| "TYPE 2" \| "BLOCKER" (or equivalent), "text", "required_by" }]` |
| `granular` | Optional string array (§9-style gates, notes) |
| `cross_cutting` | Optional string (cross-workstream ids / narrative) |

**Authoritative copy and edit order (do not skip steps):**

1. **Edit JSON first** — **`WSA/PA/pa-outcomes.json`** → **`dependency_edges`** (requires **`schema_version` ≥ 2** for PA). **`WSB-WSC/wsb-wsc-outcome-dependencies.json`** → **`dependency_edges`** for the combined O/E/T map (separate file; not `wb-outcomes.json`).
2. **Align normative prose** — Update **`PA-WBS.md`** §3 Mermaid (and per-outcome dependency tables, §8–§9 gates) or the equivalent narrative for WSB–WSC so markdown matches JSON.
3. **Sync HTML fallbacks** — Copy the same `dependency_edges` array into the **`<script type="application/json" id="pa-dependency-edges-fallback">`** (PA) or **`id="wsb-dependency-edges-fallback"`** (WSB–WSC) block inside the Outcome Map HTML so **double-click / `file://`** still renders the graph when `fetch` to the sidecar JSON fails.
4. **Runtime behavior** — Outcome maps call **`fetch`** on **`pa-outcomes.json`** or **`wsb-wsc-outcome-dependencies.json`** (same directory as the HTML); parsed edges are normalized (`decision_type` → tooltip `t`, `cross_cutting` → `crossCutting` where needed for PA).
5. **Catalog and CI** — **`WSB-WSC/dependency-sources.yml`** lists all canonical dependency JSON paths for humans and automation. **`.github/workflows/deploy-capability-map.yml`** includes those files in **`paths`** filters and zips **`wsb-wsc-outcome-dependencies.json`** and **`dependency-sources.yml`** with the Lambda package; **`WSA/PA/`** zip already includes **`pa-outcomes.json`**.

### Document Change Log (all capability `*-WBS.md` files)

On **every substantive change** to a normative capability WBS, update the **Document Change Log** at the **end** of that markdown file.

| Rule | Detail |
|------|--------|
| **Files** | `WSA/PA/PA-WBS.md`, `WSA/VI/VI-WBS.md`, `WSA/WM/WM-WBS.md`, `WSB-WSC/WB/WB-WBS.md` (and any future capability `*-WBS.md` in-repo). |
| **Placement** | Final numbered section (e.g. **§11–§13** depending on doc) titled **`Document Change Log`**, **after** status template / appendix content, **before** the closing *Document generated…* italic line. If the section is missing, **create** it. |
| **Order** | **Newest first** — insert each new entry **immediately below** the table header row (above older rows). |
| **Row content** | **`YYYY-MM-DD`** in the first column; short **summary** in the second (what changed, why if non-obvious). Optional third column or inline **Related:** `*-outcomes.json`, `*-Outcome-Map.html`, `*-kanban.html`, Jira export. |
| **PA** | Keep **§1 — Change log (planning ↔ Jira)** for backlog/epic narrative; when you add bullets there **or** change PA-WBS for any other reason, add a matching dated row to **`PA-WBS.md` §12 Document Change Log** so end-of-doc history stays complete. |

**Reminder:** After edits, commit and push to **GitHub**.

**Folder maps:** [`PA/README.md`](../../../WSA/PA/README.md), [`VI/README.md`](../../../WSA/VI/README.md), [`WM/README.md`](../../../WSA/WM/README.md), [`WSB-WSC/WB/README.md`](../../../WSB-WSC/WB/README.md).

**Canonical WBS files:** `WSA/PA/PA-WBS.md`, `WSA/VI/VI-WBS.md`, `WSA/WM/WM-WBS.md`, `WSB-WSC/WB/WB-WBS.md`.

**JSON registries:** **`WSA/PA/pa-outcomes.json`** — Jira keys (`PA-WBS.md` §10) **and** canonical **`dependency_edges`** for `PA-Outcome-map.html`. **`WSA/VI/vi-outcomes.json`**, **`WSA/WM/wm-outcomes.json`**, **`WSB-WSC/WB/wb-outcomes.json`** — outcome ↔ Jira when WBS §9/§11 is keyed; **`dependency_edges`** optional (`schema_version` ≥ 2) until those maps ship interactive Dependency Flow. **WSB–WSC combined activity map:** dependencies live in **`WSB-WSC/wsb-wsc-outcome-dependencies.json`**, not only in WB folder JSON.

**Jira-import target JSON (manual or generator):** `{Capability}/Output/{Prefix}-WBS-Jira-Import.json` for PA, VI, WM; for **WB** the folder is **`WSB-WSC/WB/`** (run **`dynamo-plan wbs prep WB`** or `node Scripts/wbs-load-prep.js WB` — paths come from **`dynamo-os.config.cjs`** via **dynamo-os/planning-toolkit**).

---

## Pattern A — Import WBS from Input (archive + regenerate)

When the user asks to **import the latest [capability] WBS information** (or similar), they mean: load everything from that capability’s **Input** folder and follow the full WBS update process.

### 1. Identify the capability

From the user’s message, determine **PA**, **VI**, **WM**, or **WB**. If unclear, ask.

### 2. Run the prep script

From the **project root** (either form runs the same logic; **`dynamo-os.config.cjs`** supplies `diskPath` / `filePrefix`):

```bash
node ../dynamo-os/planning-toolkit/bin/cli.js wbs prep <capability>
```

Or: `node Scripts/wbs-load-prep.js <capability>` (wrapper; needs sibling **dynamo-os** or **`DYNAMO_PLAN_CLI`**).

Example: `dynamo-plan wbs prep PA` (after `npm link` in **dynamo-os/planning-toolkit**)

This archives the current WBS to `{Folder}/Archive/{Prefix}-WBS-mm-dd-yyyy.md` (PA, VI, WM, WB), archives `{Folder}/Output/{Prefix}-WBS-Jira-Import.json` to `{Folder}/Output/Archive/...` (if present), and creates `{Folder}/Update-Reports/WBS-Load-mm-dd-yyyy.md` with a stub. Note the run date (mm-dd-yyyy) for step 4.

### 3. Review Input and regenerate WBS

- **Read** all files in `{Capability}/Input/`. Process **each file** explicitly.
- **For each file**: extract outcomes, deliverables, phases, risks, decisions, questions, timeline, tables. Either update the WBS (preserving keys and structure per the capability rule file) or document mapping to existing WBS keys.
- **Compare** with the current WBS file (`{Prefix}-WBS.md`) and any constraint vs outcome maps. **Regenerate** the WBS accordingly. Preserve document structure, outcome table, per-outcome sections, risks/decisions/questions tables.
- **PA:** If Jira epic keys or outcome IDs change, update **`pa-outcomes.json`** to match `PA-WBS.md` §10. If **outcome dependencies, decision gates, or PA-CW-XX links** change, update **`pa-outcomes.json` → `dependency_edges`** first, then **`PA-WBS.md`** §3–§9, then **`#pa-dependency-edges-fallback`** in **`PA-Outcome-map.html`** (see **Authoritative copy and edit order** above).
- **WSB–WSC combined map:** If O/E/T activity dependencies or blocker/decision text on edges change, update **`WSB-WSC/wsb-wsc-outcome-dependencies.json`**, align narrative docs as needed, then **`#wsb-dependency-edges-fallback`** in **`WSB-WSC-Outcome-Map.html`**. Consider **`WSB-WSC/dependency-sources.yml`** if new artifacts are added.
- **VI / WM / WB:** When Jira mapping in the WBS stabilizes, update **`vi-outcomes.json`** / **`wm-outcomes.json`** / **`wb-outcomes.json`** to match. If the capability gains an Outcome Map HTML with **Dependency Flow**, populate **`dependency_edges`** and extend **`dependency-sources.yml`**; use **`schema_version` ≥ 2** for VI/WM.
- **Fill the WBS-Load report**: per-file “Input files processed” summaries (filename → extracted content → WBS edits or “mapped to existing keys”). Do not leave this section generic.
- **Document Change Log:** Prepend a dated row to **`{Prefix}-WBS.md` → Document Change Log** summarizing the regeneration (see **Document Change Log** above).

### 3b. Refresh Change summary counts (after Jira-import JSON is updated)

```bash
node ../dynamo-os/planning-toolkit/bin/cli.js wbs report-counts <capability> <dateStamp>
```

Or: `node Scripts/wbs-load-report-counts.js …` / `dynamo-plan wbs report-counts …`. Use the same **dateStamp** as the WBS-Load report (mm-dd-yyyy).

### 4. Move processed Input to Archive

```bash
node ../dynamo-os/planning-toolkit/bin/cli.js wbs archive-input <capability> <dateStamp>
```

Or: `node Scripts/wbs-move-input-to-archive.js …` / `dynamo-plan wbs archive-input …`. Use the same **dateStamp** as the WBS-Load report (mm-dd-yyyy).

### 5. Jira import JSON (manual reminder)

After regeneration, remind the user to update `{Capability}/Output/{Prefix}-WBS-Jira-Import.json` from the new WBS if that file is maintained manually. Preserve schema (`metadata`, `work_items`, `action_items`) and WBS keys. **WM:** `node Scripts/wm-wsb-to-jira-import.js` writes **`{filePrefix}-WBS-Jira-Import.json`** under **`capabilities.WM`** from **`dynamo-os.config.cjs`** (via **`Scripts/planning-path-context.js`** when the toolkit is available; re-sync embedded data with **`WSA/WM/WM-WBS.md`** when that script’s arrays are updated). To **create issues in Jira** from that JSON, use **`dynamo-plan jira import-wm`** (or **`node Scripts/jira-import-wm.js`**) — **`--dry-run`** first; see [Scripts/README.md](../../../Scripts/README.md).

### Reference (Pattern A)

[Documentation/WBS-Update-Pattern.md](../../../Documentation/WBS-Update-Pattern.md)

---

## Pattern B — Jira ↔ WBS ↔ planning HTML alignment (PA)

Use this when the user wants **planning artifacts** (`WSA/PA/PA-WBS.md`, `WSA/PA/PA-Outcome-map.html`, `WSA/PA/PA-kanban.html`) to match **Jira as the authoritative backlog**, or after **Jira** changes (epic keys, POC story naming, subtasks, superseded epics).

### Principles

1. **Jira is source of truth** for execution status, story keys, and Sub-task completion; the WBS defines **normative** outcomes, deliverable IDs, and dependencies.
2. **Reconcile conflicts** explicitly: if static WBS or kanban “planning rows” duplicate or contradict Jira, prefer Jira for **what work exists**; update or remove static rows and **document the change in PA-WBS.md** (change log bullet with date).
3. **POC / PA-OC-00:** Pre-foundation NGINX pipeline POC is outcome **PA-OC-00** (Jira Epic **WSA-3758**). Stories with summary prefix **`[POC]`** belong under that Epic (e.g. legacy **WSA-3719**). Runner/tooling spike may also appear under **PA-OC-03** (e.g. OC-03.3). Do not invent parallel “POC-1…POC-4” WBS rows if Jira is the only execution home—**drop** them from `PA-kanban.html` `outcomeData` and record the change in the WBS.
4. **Capability keys (PA)** — verify against `.cursor/rules/pa.mdc`, **`pa-outcomes.json`**, and live Jira: **WSA-2656** (capability), **WSA-3758** (PA-OC-00), **WSA-3268–WSA-3278** (PA-OC-01…11), **WSA-2657** (action items epic), legacy **WSA-36** → **WSA-3268**.

### Steps (checklist)

1. **Refresh Jira data (PA)**  
   - Run **`node ../dynamo-os/planning-toolkit/bin/cli.js jira export`** from project root (or **`dynamo-plan jira export`** after `npm link`; needs `JIRA_URL`, `JIRA_USERNAME`, `JIRA_API_TOKEN` via **`jira.envFile`** or env). **`node Scripts/jira-export-pa.js`** forwards to the same CLI.  
   - **Or** rebuild kanban-only from the latest dated export: **`node ../dynamo-os/planning-toolkit/bin/cli.js jira kanban-rebuild PA`** (or **`node Scripts/jira-kanban-status-from-export.js`**) — no Jira API call.  
   - Outputs include **dated** `WSA/PA/Jira/PA-Jira-mm-dd-yyyy-json.json` (retain multiple dated files), `WSA/PA/Jira/pa-kanban-jira-status.json`, and `WSA/PA/Jira/pa-kanban-jira-status.js` (embedded snapshot for `file://`).

2. **Read the WBS** (`WSA/PA/PA-WBS.md`) — especially **Systems of record and planning views**, outcome table, and any POC / Jira language. Decide:  
   - Does Jira require a **WBS edit** (new change log line, clarification, or removal of obsolete wording)?  
   - Is **reclassification** needed (e.g. `[POC]` on the POC story, explicit OC-00 epic)?

3. **Update `WSA/PA/PA-WBS.md` when artifacts change**  
   - Add a **Change log** bullet under **§1 — systems of record** when the change is Jira/planning sync (epic keys, POC, kanban narrative).  
   - **Also** prepend a dated row to **`§12 Document Change Log`** at the **end** of `PA-WBS.md` for every substantive WBS edit (same date/summary; see **Document Change Log** in this skill).  
   - Keep **v1.x** and classification lines consistent if the user maintains version stamps.  
   - If epic keys changed, update **`WSA/PA/pa-outcomes.json`** **`outcomes[]`**. If dependency gates, cross-workstream links, or edge types changed, update **`dependency_edges`** in the same file, then **`#pa-dependency-edges-fallback`** in **`PA-Outcome-map.html`**.

4. **Update `WSA/PA/PA-Outcome-map.html`** (if Jira/WBS messaging changed)  
   - Subtitle: capability, epic range, action-items epic, POC story key + `[POC]` if relevant.  
   - **Planning assumptions**: authoritative backlog, FTE, POC band = active engineering (not buffer), Jira keys.  
   - POC swimlane tooltip / `detail` text: align with WBS + Jira (e.g. WSA-3758, `[POC]`).  
   - **Dependency Flow:** **`pa-outcomes.json` → `dependency_edges` is canonical** — the page loads edges via **`fetch('pa-outcomes.json')`** and builds the SVG in **`initPaDependencyGraph`**. Do **not** maintain a duplicate inline `depEdges` array in script; after any edge change, update JSON, then paste the same array into **`#pa-dependency-edges-fallback`** for offline `file://`. Edge hovers must reflect timing, prerequisites, TYPE 1/2 / BLOCKER, granular gates, and PA-CW-XX per **Outcome map dependency flow**.  
   - Footer / title: optional **PA-WBS v** stamp to match the WBS.

5. **Update `WSA/PA/PA-kanban.html`**  
   - **Intro** paragraph: Jira keys, POC epic, `[POC]`, action-items epic, legacy epic note—match WBS/pa.mdc.  
   - **`outcomeData`**: Remove or empty planning-only rows when Jira owns that work (e.g. `POC.deliverables: []` with a **short comment** in the script pointing to the WBS change log).  
   - **POC board**: Ensure **`[POC]`** stories under **WSA-3758** appear from `by_epic_key` / export (see `POC_PIPELINE_STORY_KEY` and `findPocPipelineStoryRow` if present). Avoid **`var` inside functions** where a later `const` with the same name exists in the same function (hoisting bug).  
   - **Kanban JSON**: the toolkit’s **`buildKanbanJiraStatusJson`** (invoked by **`jira export`** / **`jira kanban-rebuild`**) attaches **`subtasks[]`** to each Story (Sub-tasks indexed by parent). Cards show **progress** (done/total, segments or bar, %) and **Subtask checklist** from export; WBS-only subtasks remain as local checklist when no Jira rows.  
   - After script changes, **re-run** **`dynamo-plan jira export`** or **`dynamo-plan jira kanban-rebuild PA`** (or the **`Scripts/jira-*.js`** wrappers) and commit updated `pa-kanban-jira-status.*`.

6. **Validate**  
   - Open `WSA/PA/PA-kanban.html` in a browser: outcome grid renders (no silent JS syntax errors).  
   - `#POC` shows the pipeline POC story with Jira-linked subtasks when the export includes them.  
   - Open **`PA-Outcome-map.html`** with a **local HTTP server** from `WSA/PA/` (or deployed Lambda) so **`fetch('pa-outcomes.json')`** succeeds; confirm Dependency Flow renders. Optionally open via **`file://`** and confirm the **fallback** embed still draws the graph.

7. **Git**  
   - Commit related changes together with a clear message; remind the user to **push to GitHub**.

### Files touched in Pattern B (typical)

| Area | Files |
|------|--------|
| WBS | `WSA/PA/PA-WBS.md` |
| Outcome + dependency JSON | `WSA/PA/pa-outcomes.json` (`outcomes[]`, **`dependency_edges`**) |
| WSB–WSC dependency JSON / catalog | `WSB-WSC/wsb-wsc-outcome-dependencies.json`, `WSB-WSC/dependency-sources.yml` |
| Maps | `WSA/PA/PA-Outcome-map.html` (fetch + `#pa-dependency-edges-fallback`), `WSB-WSC/WSB-WSC-Outcome-Map.html` (fetch + `#wsb-dependency-edges-fallback`) |
| Kanban UI | `WSA/PA/PA-kanban.html` |
| Jira export / kanban data | **`dynamo-plan jira export`** / **`jira kanban-rebuild`** (or `Scripts/jira-export-pa.js`, `Scripts/jira-kanban-status-from-export.js`), `WSA/PA/Jira/pa-kanban-jira-status.json`, `WSA/PA/Jira/pa-kanban-jira-status.js`, dated `WSA/PA/Jira/PA-Jira-mm-dd-yyyy-json.json` |
| Deploy (when deps or map change) | `.github/workflows/deploy-capability-map.yml` |
| Rules / docs | `.cursor/rules/pa.mdc`, `WSA/PA/Jira/README.md`, `WSA/PA/README.md`, `Documentation/WBS-Update-Pattern.md` (optional) |

### When Pattern A and B overlap

If **Input** contains stakeholder docs that **change outcomes** while **Jira** already has epics/stories, run **Pattern A** for WBS content, then **Pattern B** to align HTML and exports—or do B after A so planning HTML and `pa-kanban-jira-status` reflect the new WBS narrative and current Jira.

### VI, WM, and WB — Jira alignment (same discipline, fewer automated scripts)

- **Normative:** `WSA/VI/VI-WBS.md`, `WSA/WM/WM-WBS.md`, `WSB-WSC/WB/WB-WBS.md`, outcome maps, kanban HTML. After edits, prepend **`Document Change Log`** row in the respective `*-WBS.md` (see **Document Change Log** above).
- **Dated exports:** keep multiple **`WSA/VI/Jira/VI-Jira-mm-dd-yyyy-json.json`**, **`WSA/WM/Jira/WM-Jira-mm-dd-yyyy-json.json`**, **`WSB-WSC/WB/Jira/WB-Jira-mm-dd-yyyy-json.json`** (same retention rule as **`WSA/PA/Jira/PA-Jira-*.json`**). **WB:** after keys exist in **`wb-outcomes.json`**, run **`dynamo-plan jira export WB`** (or **`node Scripts/jira-export-wb.js`**, which spawns the CLI). The shared exporter writes the dated JSON under **`WSB-WSC/WB/Jira/`**; it does **not** emit PA-style kanban status files for non-PA capabilities.
- **Target-state JSON:** `WSA/VI/Output/VI-WBS-Jira-Import.json`, `WSA/WM/Output/WM-WBS-Jira-Import.json`, `WSB-WSC/WB/Output/WB-WBS-Jira-Import.json`.
- Full **Pattern B** checklist above is PA-specific; for VI/WM/WB, reconcile exports vs WBS manually and refresh HTML narratives until kanban is wired to Jira (WB-kanban is WBS-static today).
- **WSB–WSC combined outcome map** (`WSB-WSC-Outcome-Map.html`): treat **`wsb-wsc-outcome-dependencies.json`** like PA’s `dependency_edges` — JSON first, then HTML fallback; not a substitute for **`WB-WBS.md`** WB-OC epics.

---

## Reference

- Pattern A (detailed): [Documentation/WBS-Update-Pattern.md](../../../Documentation/WBS-Update-Pattern.md) (includes **Outcome-map dependency edges** table)  
- Dependency catalog: [WSB-WSC/dependency-sources.yml](../../../WSB-WSC/dependency-sources.yml)  
- Folders: [PA/README.md](../../../WSA/PA/README.md), [VI/README.md](../../../WSA/VI/README.md), [WM/README.md](../../../WSA/WM/README.md), [WSB-WSC/WB/README.md](../../../WSB-WSC/WB/README.md)  
- Jira: [PA/Jira/README.md](../../../WSA/PA/Jira/README.md), [VI/Jira/README.md](../../../WSA/VI/Jira/README.md), [WM/Jira/README.md](../../../WSA/WM/Jira/README.md), [WSB-WSC/WB/Jira/README.md](../../../WSB-WSC/WB/Jira/README.md)  
- Rules: [.cursor/rules/pa.mdc](../../rules/pa.mdc), [.cursor/rules/vi.mdc](../../rules/vi.mdc), [.cursor/rules/wm.mdc](../../rules/wm.mdc), [.cursor/rules/wb.mdc](../../rules/wb.mdc)  
- Jira toolkit commands (export, delete, WM import/link, etc.): [.cursor/skills/jira-export/SKILL.md](../jira-export/SKILL.md), [Scripts/README.md](../../../Scripts/README.md)
