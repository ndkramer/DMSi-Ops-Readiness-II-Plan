# WBS update pattern — reference

Long tables, **Dependency Flow** / `dependency_edges` spec, and **Document Change Log** rules. The agent entry point is [SKILL.md](./SKILL.md).

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
| **Row content** | **`YYYY-MM-DD`** in the first column; short **summary** in the second (what changed, why if non-obvious). Optional **Related:** `*-outcomes.json`, `*-Outcome-Map.html`, `*-kanban.html`. |
| **PA** | **§1 — systems of record / planning** (change log) when backlog or planning narrative changes; for **any** substantive WBS edit, add a matching dated row to **`PA-WBS.md` Document Change Log** (end of doc) so history stays complete. |

**Reminder:** After edits, commit and push to **GitHub**.

**Folder maps:** [`PA/README.md`](../../../WSA/PA/README.md), [`VI/README.md`](../../../WSA/VI/README.md), [`WM/README.md`](../../../WSA/WM/README.md), [`WB/README.md`](../../../WSB-WSC/WB/README.md).

**Canonical WBS files:** `WSA/PA/PA-WBS.md`, `WSA/VI/VI-WBS.md`, `WSA/WM/WM-WBS.md`, `WSB-WSC/WB/WB-WBS.md`.

**JSON registries:** **`WSA/PA/pa-outcomes.json`** — outcome rows (`PA-WBS.md` §10) **and** canonical **`dependency_edges`** for `PA-Outcome-map.html`. **`WSA/VI/vi-outcomes.json`**, **`WSA/WM/wm-outcomes.json`**, **`WSB-WSC/WB/wb-outcomes.json`** — align with the WBS when those sections are keyed; **`dependency_edges`** optional (`schema_version` ≥ 2) until those maps ship interactive Dependency Flow. **WSB–WSC combined activity map:** dependencies live in **`WSB-WSC/wsb-wsc-outcome-dependencies.json`**, not only in WB folder JSON.

**`wbs prep` Output archive:** the toolkit also archives `{Folder}/Output/{Prefix}-WBS-Load-Snapshot.json` (filename from **dynamo-os** planning-toolkit) when present. That file is an optional export-shaped artifact, not part of the required Input → WBS steps.

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

This archives the current WBS to `{Folder}/Archive/{Prefix}-WBS-mm-dd-yyyy.md` (PA, VI, WM, WB), archives `{Folder}/Output/{Prefix}-WBS-Load-Snapshot.json` to `{Folder}/Output/Archive/...` (if present), and creates `{Folder}/Update-Reports/WBS-Load-mm-dd-yyyy.md` with a stub. Note the run date (mm-dd-yyyy) for step 4.

#### Gate — archive before edit

- **Do not** open or patch `{Folder}/{Prefix}-WBS.md` for this load until `wbs prep` completes **without error**. The previous live WBS must be copied to `{Folder}/Archive/{Prefix}-WBS-<date>.md` first.
- If prep **fails** (e.g. WBS file missing), **fix the error**; do not apply Input-driven WBS changes until prep succeeds.
- The dated file under `{Folder}/Archive/` is the **rollback / diff reference** for the pre-change baseline.

### 3. Review Input and regenerate WBS

- **Prerequisite: §2 completed** (WBS archived under `Archive/`; prep gate satisfied).
- **Read** all files in `{Capability}/Input/`. Process **each file** explicitly.
- **For each file**: extract outcomes, deliverables, phases, risks, decisions, questions, timeline, tables. Either update the WBS (preserving keys and structure per the capability rule file) or document mapping to existing WBS keys.
- **Compare** with the current WBS file (`{Prefix}-WBS.md`) and any constraint vs outcome maps. **Regenerate** the WBS accordingly. Preserve document structure, outcome table, per-outcome sections, risks/decisions/questions tables.
- **PA:** If **outcome IDs** or **§10** mapping change, update **`pa-outcomes.json`**. If **outcome dependencies, decision gates, or PA-CW-XX links** change, update **`pa-outcomes.json` → `dependency_edges`** first, then **`PA-WBS.md`** §3–§9, then **`#pa-dependency-edges-fallback`** in **`PA-Outcome-map.html`** (see **Authoritative copy and edit order** above).
- **WSB–WSC combined map:** If O/E/T activity dependencies or blocker/decision text on edges change, update **`WSB-WSC/wsb-wsc-outcome-dependencies.json`**, align narrative docs as needed, then **`#wsb-dependency-edges-fallback`** in **`WSB-WSC-Outcome-Map.html`**. Consider **`WSB-WSC/dependency-sources.yml`** if new artifacts are added.
- **VI / WM / WB:** When outcome rows in the WBS stabilize, update **`vi-outcomes.json`** / **`wm-outcomes.json`** / **`wb-outcomes.json`** to match. If the capability gains an Outcome Map HTML with **Dependency Flow**, populate **`dependency_edges`** and extend **`dependency-sources.yml`**; use **`schema_version` ≥ 2** for VI/WM.
- **Fill the WBS-Load report**: per-file “Input files processed” summaries (filename → extracted content → WBS edits or “mapped to existing keys”). Do not leave this section generic.
- **Document Change Log:** Prepend a dated row to **`{Prefix}-WBS.md` → Document Change Log** summarizing the regeneration (see **Document Change Log** above).

### 4. Refresh change summary counts

```bash
node ../dynamo-os/planning-toolkit/bin/cli.js wbs report-counts <capability> <dateStamp>
```

Or: `node Scripts/wbs-load-report-counts.js …` / `dynamo-plan wbs report-counts …`. Use the same **dateStamp** as the WBS-Load report (mm-dd-yyyy).

### 5. Move processed Input to Archive

```bash
node ../dynamo-os/planning-toolkit/bin/cli.js wbs archive-input <capability> <dateStamp>
```

Or: `node Scripts/wbs-move-input-to-archive.js …` / `dynamo-plan wbs archive-input …`. Use the same **dateStamp** as the WBS-Load report (mm-dd-yyyy).

### More on Pattern A

[Documentation/WBS-Update-Pattern.md](../../../Documentation/WBS-Update-Pattern.md)

---

## Further reading

- Pattern A (detailed): [Documentation/WBS-Update-Pattern.md](../../../Documentation/WBS-Update-Pattern.md) (includes **Outcome-map dependency edges** table)  
- Dependency catalog: [WSB-WSC/dependency-sources.yml](../../../WSB-WSC/dependency-sources.yml)  
- Folders: [PA/README.md](../../../WSA/PA/README.md), [VI/README.md](../../../WSA/VI/README.md), [WM/README.md](../../../WSA/WM/README.md), [WSB-WSC/WB/README.md](../../../WSB-WSC/WB/README.md)  
- Rules: [`.cursor/rules/pa.mdc`](../../rules/pa.mdc), [`.cursor/rules/vi.mdc`](../../rules/vi.mdc), [`.cursor/rules/wm.mdc`](../../rules/wm.mdc), [`.cursor/rules/wb.mdc`](../../rules/wb.mdc)  
- [Scripts/README.md](../../../Scripts/README.md) — WBS and validation wrappers  

**Historical (not default workflow):** legacy Jira export docs live under [Documentation/legacy/](../../../Documentation/legacy/) when present; see [Documentation/legacy/README.md](../../../Documentation/legacy/README.md) for the index.

## Document change log

| Date | Summary |
|------|---------|
| 2026-04-23 | **Pattern B and Jira alignment steps removed**; Input → WBS is the only skill path. [SKILL.md](./SKILL.md) updated. |
| 2026-04-23 | Spun out long content from `SKILL.md` into this file. |
