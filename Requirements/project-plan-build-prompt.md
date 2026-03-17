# Project Plan Build Process -- Cursor Prompt

You are building a Dynamo outcome-based project plan system. This document explains where the data comes from, how dates are calculated, and the exact steps to generate each file.

---

## Source Files

All data originates from the WBS (Work Breakdown Structure) markdown files:

```
WBS/
  WM-WSB.md    -- Work Management capability
  VI-WSB.md    -- Visibility Infrastructure capability
  PP-WSB.md    -- Pipeline Automation capability
```

Each WBS contains:
- A **Resource and Timeline Constraints** section with start date, deadline, staffing, and total estimated duration
- An **Outcome Map** table with outcome IDs, names, categories, target week ranges, and milestone alignment
- A **Dependency Graph** in mermaid format showing must/should/contingent relationships
- Individual **Outcome sections** with deliverables, subtasks, success criteria, risks, and decisions

These WBS files are the single source of truth. Everything in the HTML files is derived from them.

---

## Step 1: Extract the Outcome Map Table

Each WBS has an outcome map table near the top. This is the primary data source for timeline placement.

Example from WM-WSB.md:
```
| OC-01 | Current State Discovery Complete | Baseline | Weeks 1-2 | Feb 16 - Feb 27 | -- | Yes (COMPLETE) |
| OC-02 | Operating Model and Process Design Complete | Baseline | Weeks 2-3 | Feb 23 - Mar 6 | M2 (designed) | Yes (COMPLETE) |
| OC-03 | Tool Selected and System Configured | Baseline | Weeks 3-5 | Mar 2 - Mar 20 | M2 (designed) | Yes |
```

Extract from each row:
- **id**: OC-XX
- **name**: Outcome name
- **cat**: Category (Baseline, Iterative, Conditional)
- **start**: Starting week/period number
- **end**: Ending week/period number
- **milestone**: Milestone tag (M2, M3, etc.) or empty string
- **status**: If marked COMPLETE, set status to 'complete'

---

## Step 2: Calculate Calendar Dates from Week Numbers

### How week-to-date mapping works

Each WBS defines its own start date and time unit. The mapping is NOT shared across capabilities.

**WM (Work Management)**
- Start date: February 15, 2026 (Week 1 = Feb 16, Monday)
- Time unit: Weeks (1 week = 7 days)
- Total periods: 18 weeks
- Calculation: `week_start_date = start_date + (week_number - 1) * 7 days`
- Week end = week start + 4 days (Friday)
- The calendar dates in the outcome map table (e.g., "Feb 16 - Feb 27") are pre-calculated in the WBS and should be used directly when available

**VI (Visibility Infrastructure)**
- Start date: March 1, 2026 (PagerDuty AIOps); April 1, 2026 (Dynatrace)
- Time unit: Half-month periods (approximately 2 weeks each)
- Total periods: 16 (covering Mar 1 through Oct 15)
- Period labels: `['Mar 1','Mar 15','Apr 1','Apr 15','May 1','May 15','Jun 1','Jun 15','Jul 1','Jul 15','Aug 1','Aug 15','Sep 1','Sep 15','Oct 1','Oct 15']`
- The WBS uses relative week numbers (e.g., "Weeks 1-2") but the Outcome Map HTML maps these to the half-month grid columns
- The VI WBS has `[TBD -- Weeks X-Y]` placeholders. These were converted to half-month periods using the following logic:
  - Each "week" in the WBS roughly corresponds to one half-month period
  - Adjustments were made based on the stated duration in weeks from each outcome's detail section (e.g., "1.5 FTE conservative: 4 weeks" means that outcome spans 2 half-month columns)
  - Parallel outcomes that share FTE allocation were placed on overlapping rows

**PP (Pipeline Automation)**
- Start date: March 16, 2026 (Monday, Week 1)
- Time unit: Weeks (1 week = 7 days)
- Total periods: 34 weeks
- Calculation (done programmatically in the HTML):
  ```js
  const startDate = new Date(2026, 2, 16); // March 16, 2026
  for (let w = 1; w <= 34; w++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + (w - 1) * 7);
    const endD = new Date(d);
    endD.setDate(endD.getDate() + 4); // Friday
  }
  ```
- The PP WBS also has `[TBD -- Weeks X-Y]` placeholders. These were converted to absolute week numbers using:
  - POC is Weeks 1-2 (2-week proof of concept)
  - Each subsequent outcome's start week = previous outcome's end week + 1 (for sequential outcomes)
  - Parallel outcomes (OC-05 and OC-07 both start at Week 17) share the same start column
  - Duration was estimated conservatively at ~1.5x the stated week count to account for 1.5 FTE staffing

### Date calculation rules applied during the build

1. **Start with the WBS outcome map table.** If calendar dates are provided (WM has them), use those directly.
2. **If only week ranges are provided** (PP and VI use `[TBD -- Weeks X-Y]`), calculate dates using the capability's start date and time unit.
3. **For the PP Outcome Map**, week ranges were scaled up to account for conservative 1.5 FTE estimation:
   - OC-01: 3 weeks (was ~2 weeks in WBS)
   - OC-02: 3 weeks
   - OC-03: 3 weeks
   - OC-04: 5 weeks (config migration is a large effort)
   - OC-05: 3 weeks
   - OC-06: 4 weeks
   - OC-07: 5 weeks (parallel with OC-05)
   - OC-08: 5 weeks (validation with iteration cycles)
   - OC-09: 5 weeks (enforcement with iteration cycles)
4. **For the VI Outcome Map**, half-month periods were assigned based on:
   - PagerDuty AIOps (OC-16) starts at period 1 (Mar 1) since it was already underway
   - Dynatrace outcomes start at period 3 (Apr 1) per the stated Dynatrace start date
   - Each outcome's duration in the "detail" field was used to determine how many half-month columns to span
   - Parallel work (OC-04, OC-06, OC-07 all branching from OC-03) was placed on overlapping rows
5. **Conditional outcomes** (start: 0, end: 0) have no scheduled position. They appear as italic orange text spanning the full grid.

---

## Step 3: Build the Outcome Map HTML

For each capability, create an Outcome Map HTML file. The JavaScript `outcomes` array is built from the data extracted in Steps 1-2.

### Data structure per outcome

```js
{
  id: 'OC-01',
  name: 'Outcome Name',                    // from WBS outcome map table
  cat: 'Baseline',                          // Baseline | Iterative | Conditional | POC
  start: 3,                                 // grid column start (1-indexed)
  end: 5,                                   // grid column end (inclusive)
  deps: ['OC-00'],                          // from WBS dependency graph
  risk: 'R-01, R-02',                       // from WBS outcome risk section
  deliverables: 6,                          // count of deliverables in that outcome
  milestone: 'M3',                          // from WBS outcome map table
  status: 'complete',                       // only if WBS marks it as complete
  dateRange: 'Wk 3-5 (Mar 2 - Mar 20)',    // human-readable string for tooltip
  detail: 'Description for tooltip'         // from WBS outcome overview or first paragraph
}
```

### Where each field comes from

| Field | Source |
|---|---|
| `id` | WBS outcome map table, first column |
| `name` | WBS outcome map table, second column |
| `cat` | WBS outcome map table, "Category" column |
| `start`, `end` | WBS outcome map table, "Target Date" column, converted to grid column numbers per Step 2 |
| `deps` | WBS dependency graph (mermaid), extracting `must` and `should` edges for this outcome |
| `risk` | WBS outcome section, "Risks" subsection, extracting risk IDs |
| `deliverables` | Count of deliverable subsections (e.g., OC-01.1, OC-01.2, ...) under that outcome in the WBS |
| `milestone` | WBS outcome map table, "Milestone Alignment" column |
| `status` | WBS outcome map table or outcome header if marked "Status: Complete" |
| `dateRange` | Constructed from the week range and calculated calendar dates |
| `detail` | First paragraph of the WBS outcome section, summarizing the work |

### Dependency graph SVG data

The SVG dependency graph uses node positions and edge data:
- **Nodes**: Extract from `outcomes` array. Manually position x/y coordinates in the SVG to create a left-to-right flow layout. Color by category.
- **Edges**: Extract from WBS mermaid dependency graph. Each edge has `from`, `to`, and `type` (must/should/contingent).

---

## Step 4: Build the Kanban Board HTML

For each capability, create a kanban HTML file. The JavaScript `outcomeData` object is built by parsing the deliverables and subtasks from each outcome in the WBS.

### Parsing deliverables from the WBS

Each outcome in the WBS has numbered deliverables like:

```markdown
#### OC-01.1: Deliverable Name

- Subtask bullet 1
- Subtask bullet 2
- Subtask bullet 3
```

Extract:
- **id**: "OC-01.1" (outcome ID + deliverable number)
- **name**: The text after the colon in the heading
- **subtasks**: Array of bullet point strings under that deliverable

### Data structure

```js
const outcomeData = {
  "OC-01": {
    "name": "Outcome Name",
    "deliverables": [
      {
        "id": "OC-01.1",
        "name": "Deliverable Name",
        "subtasks": ["Subtask 1", "Subtask 2", "Subtask 3"]
      }
    ]
  }
};
```

All cards start in the **Backlog** column. The five columns are: Backlog, Advancing, Stalled, Blocked, Done.

---

## Step 5: Build the Combined Gantt

The Combined Gantt pulls summary data from the three Outcome Maps (not directly from the WBS files).

### Capability bar data

For each capability, determine:
- **start date**: The earliest outcome start date in that capability
- **end date**: The latest outcome end date in that capability
- **outcomes count**: Total number of outcomes (including conditional)
- **link**: Filename of the capability's Outcome Map HTML

Example calculation for WM:
- WM outcomes span Week 1 (Feb 16) to Week 18 (Jun 19)
- Start = Feb 15, 2026; End = Jun 19, 2026
- 9 outcomes total

### Bar positioning

The Combined Gantt uses a continuous date-based timeline (not grid columns):

```js
const TIMELINE_START = new Date(2026, 1, 1);  // Feb 1 (start of earliest month)
const TIMELINE_END   = new Date(2026, 10, 1); // Nov 1 (end of latest month)
const TOTAL_DAYS = (TIMELINE_END - TIMELINE_START) / 86400000;

function dateToPct(d) {
  const days = (d - TIMELINE_START) / 86400000;
  return (days / TOTAL_DAYS) * 100;
}
```

Bars are absolutely positioned using `left: dateToPct(start)%` and `width: (dateToPct(end) - dateToPct(start))%`.

### Milestone dates

Milestones are provided by the user (not derived from the WBS). They represent external reporting gates:
- M2: March 28, 2026
- M3: May 28, 2026
- M4: October 27, 2026

Position milestone lines using the same `dateToPct()` formula, with an offset for the 240px label column:
```js
line.style.left = `calc(240px + (100% - 240px) * ${pct / 100})`;
```

---

## Step 6: Wire the Navigation

### Combined Gantt to Outcome Maps
- Clicking a swim lane row navigates to the capability's Outcome Map: `lane.onclick = () => { window.location.href = cap.link; };`

### Outcome Maps to Kanban Boards
- Each outcome bar has a (+) button linking to `{PREFIX}-kanban.html#{OC-ID}`
- The (+) button uses `e.stopPropagation()` to prevent tooltip interference

### Kanban Boards back to Outcome Maps
- Header includes a back link: `<a href="{PREFIX}-Outcome-Map.html">`

### Workstream tabs (Combined Gantt)
- Workstream A shows inline Gantt content
- Other workstreams load standalone Outcome Map HTML files via iframe
- Iframes lazy-load on first tab click via the `iframeSources` map

---

## Summary: Build Sequence

1. Parse the WBS markdown files
2. Extract the outcome map tables, dependency graphs, and deliverable/subtask structures
3. Convert week ranges to grid column positions using each capability's start date and time unit
4. Build the Outcome Map HTML files (one per capability) with the outcomes array, dependency graph SVG, insights, and decisions
5. Build the Kanban Board HTML files (one per capability) with the outcomeData object
6. Build the Combined Gantt HTML with summary capability bars derived from the earliest/latest dates across each capability's outcomes
7. Add the (+) buttons to each Outcome Map bar linking to the Kanban boards
8. Add workstream tabs to the Combined Gantt, with iframe embedding for non-Workstream-A content
9. All files go in the same directory with relative links between them

---

## What to Watch For

- **WBS week numbers are relative, not absolute.** "Weeks 1-2" means the first two weeks of that capability, not a universal calendar.
- **Each capability has its own start date.** WM starts Feb 15, VI starts Mar 1 (PD) / Apr 1 (Dynatrace), PP starts Mar 16.
- **VI uses half-month periods, not weeks.** The grid has 16 columns covering 8 months, not 16 weeks.
- **PP and VI WBS files have `[TBD]` placeholders.** The Outcome Map HTML files contain the resolved dates. If the WBS is updated with firm dates, re-derive the grid positions.
- **Conservative scaling was applied to PP.** Duration estimates were multiplied by ~1.5x to account for 1.5 FTE staffing. The WBS states this explicitly in the Planning Assumptions section.
- **Parallel outcomes share the same start column.** The dependency graph determines which outcomes can overlap. Check for `must` vs `should` dependencies.
- **Conditional outcomes have no grid position.** They render as centered italic text with a trigger description.
- **Milestone dates come from the user, not the WBS.** They are external reporting gates that the project plan must align to.
- **Do not include FTE or staffing information** in the Combined Gantt. That detail belongs only in the individual Outcome Maps.
