#!/usr/bin/env node
/**
 * Sync stage dates into capability-map-state.json from outcome-map HTML files.
 *
 * Uses constraint→outcome mapping (see plan) to derive targetStart/targetEnd for
 * each stage from WM, VI, and PA outcome maps. Only stages for capabilities
 * wm, vi, pa are updated; other capabilities are left unchanged.
 *
 * Run from project root: node Capability-map/sync-stage-dates-from-outcome-maps.js
 *
 * Requires: WSA/WM/WM-Outcome-Map.html, WSA/VI/VI-WSB-Outcome-Map.html, WSA/PA/PA-Outcome-map.html,
 *           WSB-WSC/WSB-WSC-Outcome-Map.html (Workstream B & C)
 * Updates: Capability-map/capability-map-state.json (stages[].targetStart/targetEnd, lastUpdated)
 *         Capability-map/capability-map.html (EMBEDDED_STATE block, so file-open shows current dates)
 * Dates are formatted as "Mon D, YYYY" (e.g. Feb 16, 2026) when outcome maps provide day-level ranges.
 */

const fs = require('fs');
const path = require('path');
const { getCapabilityFolder } = require('../Scripts/wbs-capability-folder');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const STATE_PATH = path.join(__dirname, 'capability-map-state.json');
const HTML_PATH = path.join(__dirname, 'capability-map.html');
const EMBEDDED_STATE_REGEX = /var EMBEDDED_STATE = \{[\s\S]*?\n\};/;

// Abbreviated month names (capability-map uses "Jun" not "June")
const MONTH_ABBREV = { Jan: 'Jan', Feb: 'Feb', Mar: 'Mar', Apr: 'Apr', May: 'May', Jun: 'Jun', Jul: 'Jul', Aug: 'Aug', Sep: 'Sep', Oct: 'Oct', Nov: 'Nov', Dec: 'Dec' };
function toMonYyyy(date) {
  const m = date.toLocaleString('en-US', { month: 'short' });
  return `${MONTH_ABBREV[m] || m} ${date.getFullYear()}`;
}
/** Format as "Mon D, YYYY" for accurate display and sprint lookup (e.g. "Feb 16, 2026"). */
function toMonDayYyyy(date) {
  const m = date.toLocaleString('en-US', { month: 'short' });
  const d = date.getDate();
  const y = date.getFullYear();
  return `${MONTH_ABBREV[m] || m} ${d}, ${y}`;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ---- Parse WM outcome map (dateRange like 'Wk 1-2 (Feb 16 - Feb 27)') ----
function parseWMOutcomes(html) {
  const outcomes = {};
  const re = /\{\s*id:'(WM-OC-\d+)'[\s\S]*?dateRange:'([^']+)'/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const id = m[1];
    const dateRange = m[2];
    const dateMatch = dateRange.match(/([A-Za-z]+)\s+(\d+)\s*-\s*([A-Za-z]+)\s+(\d+)/);
    if (!dateMatch) continue;
    const startMon = dateMatch[1].slice(0, 3);
    const startDay = parseInt(dateMatch[2], 10);
    const endMon = dateMatch[3].slice(0, 3);
    const endDay = parseInt(dateMatch[4], 10);
    const startMonthIdx = MONTHS.indexOf(startMon);
    const endMonthIdx = MONTHS.indexOf(endMon);
    if (startMonthIdx === -1 || endMonthIdx === -1) continue;
    const year = 2026;
    outcomes[id] = { start: new Date(year, startMonthIdx, startDay), end: new Date(year, endMonthIdx, endDay) };
  }
  return outcomes;
}

// ---- Parse VI outcome map (dateRange like 'Apr 1 - Apr 25' or 'Jun 30 - Aug 8') ----
function parseVIOutcomes(html) {
  const outcomes = {};
  const re = /\{\s*id:'(VI-OC-\d+)'[\s\S]*?dateRange:'([^']+)'/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const id = m[1];
    const dateRange = m[2];
    if (dateRange.startsWith('Conditional')) continue;
    if (dateRange.startsWith('Nov')) {
      outcomes[id] = { start: new Date(2026, 10, 1), end: new Date(2026, 10, 1) };
      continue;
    }
    const dateMatch = dateRange.match(/([A-Za-z]+)\s+(\d+)\s*-\s*([A-Za-z]+)\s+(\d+)/);
    if (!dateMatch) continue;
    const startMon = dateMatch[1].slice(0, 3);
    const startDay = parseInt(dateMatch[2], 10);
    const endMon = dateMatch[3].slice(0, 3);
    const endDay = parseInt(dateMatch[4], 10);
    const startMonthIdx = MONTHS.indexOf(startMon);
    const endMonthIdx = MONTHS.indexOf(endMon);
    if (startMonthIdx === -1 || endMonthIdx === -1) continue;
    outcomes[id] = { start: new Date(2026, startMonthIdx, startDay), end: new Date(2026, endMonthIdx, endDay) };
  }
  return outcomes;
}

// ---- Parse PA outcome map (start/end week numbers; startDate = Mar 16, 2026) ----
function parsePAOutcomes(html) {
  const outcomes = {};
  const re = /\{\s*id:'(PA-OC-\d+|POC)'[\s\S]*?start:(\d+),\s*end:(\d+)/g;
  let m;
  const startDate = new Date(2026, 2, 16); // March 16, 2026
  while ((m = re.exec(html)) !== null) {
    const id = m[1];
    const start = parseInt(m[2], 10);
    const end = parseInt(m[3], 10);
    if (start === 0 && end === 0) continue;
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + (start - 1) * 7);
    const weekEnd = new Date(startDate);
    weekEnd.setDate(weekEnd.getDate() + (end - 1) * 7 + 4);
    outcomes[id] = { start: weekStart, end: weekEnd };
  }
  return outcomes;
}

// ---- Parse WSB-WSC outcome map (activities with start/end sprint; 24 sprints, 2 weeks each) ----
// Calendar dates pending in source; assume Sprint 1 = Mar 1, 2026 for month derivation
function parseWSBWSCActivities(html) {
  const activities = {};
  const re = /\{\s*id:'([OTE]\d+)'[\s\S]*?start:(\d+),\s*end:(\d+)/g;
  let m;
  const sprintStartDate = new Date(2026, 2, 1); // March 1, 2026
  const SPRINT_DAYS = 14;
  while ((m = re.exec(html)) !== null) {
    const id = m[1];
    const start = parseInt(m[2], 10);
    const end = parseInt(m[3], 10);
    const startDate = new Date(sprintStartDate);
    startDate.setDate(sprintStartDate.getDate() + (start - 1) * SPRINT_DAYS);
    const endDate = new Date(sprintStartDate);
    endDate.setDate(sprintStartDate.getDate() + end * SPRINT_DAYS - 1);
    activities[id] = { start: startDate, end: endDate };
  }
  return activities;
}

// WSB/WSC stage num -> activity IDs that cover that stage (from wsb/wsc fields in outcome map)
const WSB_STAGE_ACTIVITIES = {
  0: ['O1'],
  1: ['O1', 'O2', 'E1'],
  2: ['O2', 'E2'],
  3: ['O2', 'O3', 'E2'],
  4: ['O3', 'O4', 'E3'],
  5: ['O4', 'E3'],
};
const WSC_STAGE_ACTIVITIES = {
  0: ['O1', 'T1'],
  1: ['E1', 'T1'],
  2: ['E2', 'T2'],
  3: ['T3'],
  4: ['T4', 'T5'],
  5: ['E3', 'T5', 'T6'],
};

// ---- Stage → outcome IDs (constraint model → outcome model) ----
const STAGE_OUTCOMES = {
  wm: {
    0: ['WM-OC-01'],
    1: ['WM-OC-01'],
    2: ['WM-OC-02'],
    3: ['WM-OC-03', 'WM-OC-04'],
    4: ['WM-OC-05'],
    5: ['WM-OC-07'],
    6: ['WM-OC-09'],
  },
  vi: {
    0: ['VI-OC-01', 'VI-OC-02'],
    1: ['VI-OC-02'],
    2: ['VI-OC-03', 'VI-OC-04', 'VI-OC-05'],
    3: ['VI-OC-06'],
    4: ['VI-OC-07'],
    5: ['VI-OC-08'],
  },
  pa: {
    0: ['PA-OC-01'],
    1: ['PA-OC-02'],
    // Stage 2 = POC + PA-OC-01 + PA-OC-02 + PA-OC-03 (per outcome map: Week 1 = 3/16/26)
    2: ['POC', 'PA-OC-01', 'PA-OC-02', 'PA-OC-03'],
    3: ['PA-OC-04'],
    4: ['PA-OC-05', 'PA-OC-06', 'PA-OC-07', 'PA-OC-08'],
    5: ['PA-OC-09'],
    // 6, 7, 8 have no mapping — leave existing
  },
  // wsb, wsc use WSB_STAGE_ACTIVITIES / WSC_STAGE_ACTIVITIES and activity dates (sprint-based)
};

function computeStageDates(capabilityId, stageNum, outcomeDates) {
  const ids = STAGE_OUTCOMES[capabilityId] && STAGE_OUTCOMES[capabilityId][stageNum];
  if (!ids || ids.length === 0) return null;
  let minStart = null;
  let maxEnd = null;
  for (const id of ids) {
    const d = outcomeDates[id];
    if (!d) continue;
    if (!minStart || d.start < minStart) minStart = d.start;
    if (!maxEnd || d.end > maxEnd) maxEnd = d.end;
  }
  if (!minStart || !maxEnd) return null;
  return { targetStart: toMonDayYyyy(minStart), targetEnd: toMonDayYyyy(maxEnd) };
}

function computeWSBWSCStageDates(capabilityId, stageNum, activityDates) {
  const ids = capabilityId === 'wsb' ? WSB_STAGE_ACTIVITIES[stageNum] : WSC_STAGE_ACTIVITIES[stageNum];
  if (!ids || ids.length === 0) return null;
  let minStart = null;
  let maxEnd = null;
  for (const id of ids) {
    const d = activityDates[id];
    if (!d) continue;
    if (!minStart || d.start < minStart) minStart = d.start;
    if (!maxEnd || d.end > maxEnd) maxEnd = d.end;
  }
  if (!minStart || !maxEnd) return null;
  return { targetStart: toMonDayYyyy(minStart), targetEnd: toMonDayYyyy(maxEnd) };
}

function getStageDates(capabilityId, stageNum, outcomeDatesByCap, wsbWscActivityDates) {
  if (capabilityId === 'wsb' || capabilityId === 'wsc') {
    return computeWSBWSCStageDates(capabilityId, stageNum, wsbWscActivityDates);
  }
  return computeStageDates(capabilityId, stageNum, outcomeDatesByCap[capabilityId]);
}

function main() {
  const wmHtml = fs.readFileSync(path.join(getCapabilityFolder('WM'), 'WM-Outcome-Map.html'), 'utf8');
  const viHtml = fs.readFileSync(path.join(getCapabilityFolder('VI'), 'VI-WSB-Outcome-Map.html'), 'utf8');
  const paHtml = fs.readFileSync(path.join(getCapabilityFolder('PA'), 'PA-Outcome-map.html'), 'utf8');
  const wsbWscPath = path.join(PROJECT_ROOT, 'WSB-WSC', 'WSB-WSC-Outcome-Map.html');
  let wsbWscActivityDates = {};
  if (fs.existsSync(wsbWscPath)) {
    const wsbWscHtml = fs.readFileSync(wsbWscPath, 'utf8');
    wsbWscActivityDates = parseWSBWSCActivities(wsbWscHtml);
  }

  const wmDates = parseWMOutcomes(wmHtml);
  const viDates = parseVIOutcomes(viHtml);
  const paDates = parsePAOutcomes(paHtml);

  const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));

  const outcomeDatesByCap = { wm: wmDates, vi: viDates, pa: paDates };
  const capsToUpdate = ['wm', 'vi', 'pa'];
  if (Object.keys(wsbWscActivityDates).length > 0) capsToUpdate.push('wsb', 'wsc');

  let updated = 0;
  for (const stage of state.stages) {
    const cap = stage.capabilityId;
    if (!capsToUpdate.includes(cap)) continue;
    // PA stages 0 and 1 are manually set (S1/S2 completed); do not overwrite with outcome map
    if (cap === 'pa' && (stage.num === 0 || stage.num === 1)) continue;
    const dates = getStageDates(cap, stage.num, outcomeDatesByCap, wsbWscActivityDates);
    if (!dates) continue;
    stage.targetStart = dates.targetStart;
    stage.targetEnd = dates.targetEnd;
    updated++;
  }

  state.lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n', 'utf8');
  console.log(`Updated ${updated} stage dates; lastUpdated set to ${state.lastUpdated}.`);

  // Keep EMBEDDED_STATE in capability-map.html in sync (for file:// open)
  let html = fs.readFileSync(HTML_PATH, 'utf8');
  const newEmbed = 'var EMBEDDED_STATE = ' + JSON.stringify(state, null, 2) + ';\n';
  if (!EMBEDDED_STATE_REGEX.test(html)) {
    console.warn('Warning: could not find EMBEDDED_STATE block in capability-map.html; HTML was not updated.');
  } else {
    html = html.replace(EMBEDDED_STATE_REGEX, newEmbed);
    fs.writeFileSync(HTML_PATH, html, 'utf8');
    console.log('Updated EMBEDDED_STATE in capability-map.html.');
  }
}

main();
