#!/usr/bin/env node
/**
 * Build Gantt data from PA, VI, and WM WBS markdown files.
 *
 * Reads WM/WM-WSB.md, VI/VI-WSB.md, PA/PA-WSB.md (paths relative to repo root),
 * parses the Outcome Map table in each, computes capability start/end dates,
 * and writes Project-Plan/gantt-data.json for use by Combined-Outcome-Gantt.html.
 *
 * See Requirements/project-plan-build-prompt.md for date rules and data sources.
 *
 * Usage (from repo root):
 *   node Project-Plan/build-gantt-data.js
 *
 * Optional: inject generated JSON into the HTML for file:// viewing:
 *   node Project-Plan/build-gantt-data.js --inline
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const PROJECT_PLAN = __dirname;

/** Parse a markdown table row into cells (trimmed). */
function parseTableRow(line) {
  if (!line.trim().startsWith('|')) return null;
  return line.split('|').slice(1, -1).map(c => c.trim());
}

/** Find the Outcome Map table in WBS markdown and return array of row arrays. */
function extractOutcomeMapTable(content) {
  const lines = content.split(/\r?\n/);
  let inTable = false;
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s+2\.\s*Outcome\s+Map\s*$/i.test(line)) {
      inTable = true;
      continue;
    }
    if (inTable) {
      if (line.startsWith('|')) {
        const cells = parseTableRow(line);
        if (cells && cells.length >= 4) {
          const first = (cells[0] || '').trim();
          if (first === 'ID' || /^[-:\s]+$/.test(first)) continue;
          rows.push(cells);
        }
      } else if (line.startsWith('###') || line.startsWith('##')) {
        break;
      }
    }
  }
  return rows;
}

/** Parse "Feb 16 - Feb 27" or "Mar 2 - Mar 20" into { start: Date, end: Date }. */
function parseCalendarRange(str) {
  if (!str || typeof str !== 'string') return null;
  const match = str.match(/([A-Za-z]+)\s+(\d+)\s*[-–]\s*([A-Za-z]+)\s+(\d+)/);
  if (!match) return null;
  const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const [, m1, d1, m2, d2] = match;
  const start = new Date(2026, months[m1] ?? 0, parseInt(d1, 10));
  const end = new Date(2026, months[m2] ?? 0, parseInt(d2, 10));
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  return { start, end };
}

/** Parse "Weeks 1-2" or "Week 6-10" into { startWeek, endWeek }. */
function parseWeekRange(str) {
  if (!str || typeof str !== 'string') return null;
  const tbd = str.match(/\[TBD\s*--\s*Weeks?\s*(\d+)\s*[-–]\s*(\d+)\]/i);
  if (tbd) return { startWeek: parseInt(tbd[1], 10), endWeek: parseInt(tbd[2], 10) };
  const plain = str.match(/Weeks?\s*(\d+)\s*[-–]\s*(\d+)/i);
  if (plain) return { startWeek: parseInt(plain[1], 10), endWeek: parseInt(plain[2], 10) };
  const single = str.match(/Week\s*(\d+)\s*[-+]/i);
  if (single) return { startWeek: parseInt(single[1], 10), endWeek: parseInt(single[1], 10) + 2 };
  return null;
}

/** Parse "March 9 - April 20 (Active)" style range. */
function parseNamedMonthRange(str) {
  if (!str || typeof str !== 'string') return null;
  const months = { January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 };
  const match = str.match(/([A-Za-z]+)\s+(\d+)\s*[-–]\s*([A-Za-z]+)\s+(\d+)/);
  if (!match) return null;
  const [, m1, d1, m2, d2] = match;
  const start = new Date(2026, months[m1] ?? 0, parseInt(d1, 10));
  const end = new Date(2026, months[m2] ?? 0, parseInt(d2, 10));
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  return { start, end };
}

/** Week number to date: week 1 = startDate, week N = startDate + (N-1)*7 days. End of week = start + 4 days (Friday). */
function weekToDateRange(startDate, startWeek, endWeek) {
  const start = new Date(startDate);
  start.setDate(start.getDate() + (startWeek - 1) * 7);
  const end = new Date(startDate);
  end.setDate(end.getDate() + (endWeek - 1) * 7 + 4);
  return { start, end };
}

/** Check if outcome is conditional (no scheduled dates). */
function isConditional(category, targetDateStr) {
  if (!category) return false;
  if (/conditional/i.test(category)) return true;
  if (/trigger|TBD.*trigger/i.test(targetDateStr || '')) return true;
  return false;
}

// --- WM ---
const WM_START = new Date(2026, 1, 15); // Feb 15, 2026

function parseWM(content) {
  const rows = extractOutcomeMapTable(content);
  const outcomes = [];
  for (const row of rows) {
    const [id, name, category, targetDate, calendar, milestone, withinMay] = row;
    if (!id || !name) continue;
    const conditional = isConditional(category, targetDate);
    let start = null, end = null;
    if (calendar) {
      const range = parseCalendarRange(calendar);
      if (range) ({ start, end } = range);
    }
    if (!start && !conditional) {
      const weeks = parseWeekRange(targetDate);
      if (weeks) ({ start, end } = weekToDateRange(WM_START, weeks.startWeek, weeks.endWeek));
    }
    const status = (withinMay || '').includes('COMPLETE') ? 'complete' : undefined;
    outcomes.push({ id, name, category, start, end, milestone: milestone || '', status });
  }
  return outcomes;
}

// --- VI ---
const VI_START = new Date(2026, 2, 1);   // Mar 1, 2026 (PagerDuty); Dynatrace Apr 1 - use Mar 1 for min bar

function parseVI(content) {
  const rows = extractOutcomeMapTable(content);
  const outcomes = [];
  for (const row of rows) {
    const [id, name, category, targetDate, milestone] = row;
    if (!id || !name) continue;
    const conditional = isConditional(category, targetDate);
    let start = null, end = null;
    // VI-OC-16 has explicit "March 9 - April 20 (Active)"
    const namedRange = parseNamedMonthRange(targetDate);
    if (namedRange) ({ start, end } = namedRange);
    else if (!conditional) {
      const weeks = parseWeekRange(targetDate);
      if (weeks) ({ start, end } = weekToDateRange(VI_START, weeks.startWeek, weeks.endWeek));
    }
    outcomes.push({ id, name, category, start, end, milestone: milestone || '' });
  }
  return outcomes;
}

// --- PA (Pipeline Automation) ---
const PA_START = new Date(2026, 2, 16); // Mar 16, 2026

/** PA uses conservative ~1.5x duration scaling per prompt (1.5 FTE staffing). */
function paScaledWeeks(startWeek, endWeek) {
  const span = endWeek - startWeek + 1;
  const scaledSpan = Math.max(1, Math.ceil(span * 1.5));
  return { startWeek, endWeek: startWeek + scaledSpan - 1 };
}

function parsePA(content) {
  const rows = extractOutcomeMapTable(content);
  const outcomes = [];
  for (const row of rows) {
    const [id, name, category, targetDate, milestone] = row;
    if (!id || !name) continue;
    const conditional = isConditional(category, targetDate);
    let start = null, end = null;
    if (!conditional) {
      const weeks = parseWeekRange(targetDate);
      if (weeks) {
        const scaled = paScaledWeeks(weeks.startWeek, weeks.endWeek);
        ({ start, end } = weekToDateRange(PA_START, scaled.startWeek, scaled.endWeek));
      }
    }
    outcomes.push({ id, name, category, start, end, milestone: milestone || '' });
  }
  return outcomes;
}

/** Compute capability start/end from outcomes (skip conditional with no dates). */
function capabilityRange(outcomes) {
  let min = null, max = null;
  for (const o of outcomes) {
    if (o.start && o.end) {
      const t1 = o.start.getTime(), t2 = o.end.getTime();
      if (min === null || t1 < min) min = t1;
      if (max === null || t2 > max) max = t2;
    }
  }
  return { start: min ? new Date(min) : null, end: max ? new Date(max) : null };
}

/** Build meta string for a capability (e.g. "9 outcomes | OC-01 & OC-02 complete"). */
function buildMeta(outcomes, prefix) {
  const total = outcomes.length;
  const complete = outcomes.filter(o => o.status === 'complete').length;
  const completeIds = outcomes.filter(o => o.status === 'complete').map(o => o.id.replace(prefix + '-', '')).join(', ');
  if (complete > 0) return `${total} outcomes | ${completeIds} complete`;
  return `${total} outcomes`;
}

function main() {
  const wmPath = path.join(REPO_ROOT, 'WM', 'WM-WSB.md');
  const viPath = path.join(REPO_ROOT, 'VI', 'VI-WSB.md');
  const paPath = path.join(REPO_ROOT, 'PA', 'PA-WSB.md');

  const wmContent = fs.readFileSync(wmPath, 'utf8');
  const viContent = fs.readFileSync(viPath, 'utf8');
  const paContent = fs.readFileSync(paPath, 'utf8');

  const wmOutcomes = parseWM(wmContent);
  const viOutcomes = parseVI(viContent);
  const paOutcomes = parsePA(paContent);

  const wmRange = capabilityRange(wmOutcomes);
  const viRange = capabilityRange(viOutcomes);
  const paRange = capabilityRange(paOutcomes);

  const timelineStart = new Date(2026, 1, 1);
  const timelineEnd = new Date(2026, 10, 1);

  const capabilities = [
    {
      id: 'WM',
      name: 'Work Management',
      meta: buildMeta(wmOutcomes, 'WM'),
      barClass: 'bar-wm',
      start: (wmRange.start || WM_START).toISOString().slice(0, 10),
      end: (wmRange.end || new Date(2026, 5, 19)).toISOString().slice(0, 10),
      link: '../WM/WM-Outcome-Map.html',
      outcomes: wmOutcomes.length,
      detail: 'Process design, tool selection, adoption, board accuracy, flow metrics, prioritization. OC-01 (Discovery) and OC-02 (Operating Model) already complete.'
    },
    {
      id: 'VI',
      name: 'Visibility Infrastructure',
      meta: buildMeta(viOutcomes, 'VI'),
      barClass: 'bar-vi',
      start: (viRange.start || new Date(2026, 2, 1)).toISOString().slice(0, 10),
      end: (viRange.end || new Date(2026, 9, 31)).toISOString().slice(0, 10),
      link: '../VI/VI-WSB-Outcome-Map.html',
      outcomes: viOutcomes.length,
      detail: 'Dynatrace rollout, PagerDuty AIOps, host instrumentation, log migration, synthetic monitoring, application telemetry, alerting, proactive operations.'
    },
    {
      id: 'PP',
      name: 'Pipeline Automation',
      meta: `${paOutcomes.length} outcomes + POC | Starts with 2-week POC`,
      barClass: 'bar-pp',
      start: (paRange.start || new Date(2026, 2, 16)).toISOString().slice(0, 10),
      end: (paRange.end || new Date(2026, 9, 30)).toISOString().slice(0, 10),
      link: '../PA/PA-Outcome-map.html',
      outcomes: paOutcomes.length,
      detail: 'NGINX config pipeline POC, foundation, config inventory, version control migration, build/deploy/drift pipelines, reliability validation, config-as-code enforcement.'
    }
  ];

  const milestones = [
    { id: 'M2', date: '2026-03-28', label: 'M2: Mar 28' },
    { id: 'M3', date: '2026-05-28', label: 'M3: May 28' },
    { id: 'M4', date: '2026-10-27', label: 'M4: Oct 27' }
  ];

  const ganttData = {
    generatedAt: new Date().toISOString(),
    timeline: { start: timelineStart.toISOString().slice(0, 10), end: timelineEnd.toISOString().slice(0, 10) },
    milestones,
    capabilities,
    summaryCards: {
      WM: { title: 'Work Management', detail: `${wmOutcomes.length} outcomes\n${capabilities[0].start} - ${capabilities[0].end}` },
      VI: { title: 'Visibility Infrastructure', detail: `${viOutcomes.length} outcomes\n${capabilities[1].start} - ${capabilities[1].end}` },
      PP: { title: 'Pipeline Automation', detail: `${paOutcomes.length} outcomes (+ POC)\n${capabilities[2].start} - ${capabilities[2].end}` }
    }
  };

  const outPath = path.join(PROJECT_PLAN, 'gantt-data.json');
  fs.writeFileSync(outPath, JSON.stringify(ganttData, null, 2), 'utf8');
  console.log('Wrote', outPath);

  const doInline = process.argv.includes('--inline');
  if (doInline) {
    const htmlPath = path.join(PROJECT_PLAN, 'Combined-Outcome-Gantt.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    const scriptTag = `<script>window.GANTT_DATA = ${JSON.stringify(ganttData)};</script>`;
    if (html.includes('window.GANTT_DATA')) {
      html = html.replace(/<script>window\.GANTT_DATA = \{[\s\S]*?\};<\/script>/, scriptTag);
    } else {
      html = html.replace('</head>', `${scriptTag}\n</head>`);
    }
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log('Inlined GANTT_DATA into Combined-Outcome-Gantt.html');
  }
}

main();
