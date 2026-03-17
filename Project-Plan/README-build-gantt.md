# Combined Gantt Build Process

This document describes the **reusable process** that generates `Combined-Outcome-Gantt.html` from WBS data in the PA, VI, and WM folders. The Gantt chart is populated from a single JSON file: **`gantt-data.json`**.

## Overview

1. **Source of truth**: WBS markdown files in each capability folder:
   - `WM/WM-WSB.md` — Work Management
   - `VI/VI-WSB.md` — Visibility Infrastructure
   - `PA/PA-WSB.md` — Pipeline Automation

2. **Build script**: `Project-Plan/build-gantt-data.js` reads those files, parses the **Outcome Map** table in each, computes capability start/end dates, and writes **`Project-Plan/gantt-data.json`**.

3. **Gantt HTML**: `Project-Plan/Combined-Outcome-Gantt.html` loads `gantt-data.json` and renders the timeline, summary cards, and swim lanes. If the JSON is missing (e.g. opening via `file://` without a server), it falls back to embedded default data.

## How to Run the Build

From the **repository root**:

```bash
node Project-Plan/build-gantt-data.js
```

This updates `Project-Plan/gantt-data.json` only.

To also **inline** the JSON into the HTML (so the Gantt works when opened as a local file without a web server):

```bash
node Project-Plan/build-gantt-data.js --inline
```

After `--inline`, opening `Combined-Outcome-Gantt.html` directly in a browser will use the inlined data and not require `fetch('gantt-data.json')`.

## gantt-data.json Schema

The generated JSON has this structure:

| Field | Description |
|-------|-------------|
| `generatedAt` | ISO timestamp when the file was built |
| `timeline.start` / `timeline.end` | Overall timeline window (e.g. Feb 1 – Nov 1, 2026) |
| `milestones` | Array of `{ id, date, label }` for M2, M3, M4 |
| `capabilities` | Array of capability bars: `id`, `name`, `meta`, `barClass`, `start`, `end`, `link`, `outcomes`, `detail` |
| `summaryCards` | Optional `WM`, `VI`, `PP` objects with `title` and `detail` for the three summary cards |

Dates are ISO date strings (`YYYY-MM-DD`). The HTML converts them to `Date` for positioning and display.

## Data Rules (from project-plan-build-prompt.md)

- **WM**: Outcome Map has a **Calendar** column; those dates are used directly. Start date: Feb 15, 2026.
- **VI**: Outcome Map uses `[TBD -- Weeks X-Y]` or explicit ranges (e.g. "March 9 - April 20"). Start date: Mar 1, 2026; week numbers are converted to dates.
- **PA**: Outcome Map uses `[TBD -- Weeks X-Y]`. Start date: Mar 16, 2026. Durations are scaled by ~1.5× (conservative staffing).
- **Conditional** outcomes (no scheduled dates) are excluded from capability start/end calculation.
- **Milestones** (M2, M3, M4) are fixed in the script; they are not read from the WBS.

## File Locations

| File | Purpose |
|------|---------|
| `Project-Plan/build-gantt-data.js` | Build script: parse WBS → write gantt-data.json (optional --inline) |
| `Project-Plan/gantt-data.json` | Generated; consumed by Combined-Outcome-Gantt.html |
| `Project-Plan/Combined-Outcome-Gantt.html` | Combined Gantt view; loads gantt-data.json or window.GANTT_DATA |
| `Requirements/project-plan-build-prompt.md` | Full build and date-calculation rules |

## Viewing the Gantt

- **With a local server** (recommended): Serve the repo or `Project-Plan/` folder (e.g. `npx serve Project-Plan`) and open `Combined-Outcome-Gantt.html`. It will `fetch('gantt-data.json')`.
- **Without a server**: Run the build with `--inline` and open `Combined-Outcome-Gantt.html` in the browser. The inlined `window.GANTT_DATA` is used.

---

*Remember to save to GitHub periodically (e.g. hourly) when making changes.*
