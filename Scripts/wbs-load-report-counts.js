#!/usr/bin/env node
/**
 * WBS Load Report Counts: diff archived vs current Jira-import JSON and update the
 * WBS-Load report "Change summary" table with added/deleted/updated counts.
 *
 * Run after regenerating the WBS/JSON. Compares:
 *   {Folder}/Output/Archive/{Prefix}-WBS-Jira-Import-{dateStamp}.json (before)
 *   {Folder}/Output/{Prefix}-WBS-Jira-Import.json (after)
 *
 * Run from project root: node Scripts/wbs-load-report-counts.js <capability> <dateStamp>
 * Example: node Scripts/wbs-load-report-counts.js PA 03-17-2026
 *
 * DateStamp must match the report filename: WBS-Load-{dateStamp}.md
 */

const fs = require('fs');
const path = require('path');
const { getCapabilityFolder } = require('./wbs-capability-folder');

function itemMap(arr, keyField) {
  const m = new Map();
  for (const i of arr) {
    const k = i[keyField];
    if (k != null) m.set(k, i);
  }
  return m;
}

function diffCounts(oldArr, newArr, keyField) {
  const oldMap = itemMap(oldArr, keyField);
  const newMap = itemMap(newArr, keyField);
  let added = 0, deleted = 0, updated = 0;
  const allKeys = new Set([...oldMap.keys(), ...newMap.keys()]);
  for (const k of allKeys) {
    const o = oldMap.get(k);
    const n = newMap.get(k);
    if (!o) added++;
    else if (!n) deleted++;
    else if (JSON.stringify(o) !== JSON.stringify(n)) updated++;
  }
  return { added, deleted, updated };
}

function run(capability, dateStamp) {
  const prefix = capability;
  const folderPath = getCapabilityFolder(capability);
  const archivedJsonPath = path.join(folderPath, 'Output', 'Archive', `${prefix}-WBS-Jira-Import-${dateStamp}.json`);
  const currentJsonPath = path.join(folderPath, 'Output', `${prefix}-WBS-Jira-Import.json`);
  const reportPath = path.join(folderPath, 'Update-Reports', `WBS-Load-${dateStamp}.md`);

  if (!fs.existsSync(archivedJsonPath)) {
    console.error(`Archived JSON not found: ${archivedJsonPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(currentJsonPath)) {
    console.error(`Current JSON not found: ${currentJsonPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(reportPath)) {
    console.error(`Report not found: ${reportPath}`);
    process.exit(1);
  }

  const archived = JSON.parse(fs.readFileSync(archivedJsonPath, 'utf8'));
  const current = JSON.parse(fs.readFileSync(currentJsonPath, 'utf8'));

  const work = diffCounts(archived.work_items || [], current.work_items || [], 'outcome_id');
  const risks = diffCounts(
    (archived.action_items || []).filter((i) => i.item_type === 'Risk'),
    (current.action_items || []).filter((i) => i.item_type === 'Risk'),
    'item_id'
  );
  const decisions = diffCounts(
    (archived.action_items || []).filter((i) => i.item_type === 'Decision'),
    (current.action_items || []).filter((i) => i.item_type === 'Decision'),
    'item_id'
  );
  const questions = diffCounts(
    (archived.action_items || []).filter((i) => i.item_type === 'Question'),
    (current.action_items || []).filter((i) => i.item_type === 'Question'),
    'item_id'
  );

  const tableBlock = `| Category    | Added | Deleted | Updated |
|-------------|-------|---------|---------|
| Work items  | ${work.added}     | ${work.deleted}       | ${work.updated}       |
| Risks       | ${risks.added}     | ${risks.deleted}       | ${risks.updated}       |
| Decisions   | ${decisions.added}     | ${decisions.deleted}       | ${decisions.updated}       |
| Questions   | ${questions.added}     | ${questions.deleted}       | ${questions.updated}       |
`;

  let report = fs.readFileSync(reportPath, 'utf8');
  const tableRegex = /\| Category\s+\| Added \| Deleted \| Updated \|\n\|[-|]+\|\n\| Work items  \| .+ \|\n\| Risks       \| .+ \|\n\| Decisions   \| .+ \|\n\| Questions   \| .+ \|\n?/;
  if (!tableRegex.test(report)) {
    console.error('Could not find Change summary table in report.');
    process.exit(1);
  }
  report = report.replace(tableRegex, tableBlock);

  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(`Updated change summary in ${capability}/Update-Reports/WBS-Load-${dateStamp}.md`);
  console.log(`  Work items: +${work.added} -${work.deleted} ~${work.updated}`);
  console.log(`  Risks: +${risks.added} -${risks.deleted} ~${risks.updated}`);
  console.log(`  Decisions: +${decisions.added} -${decisions.deleted} ~${decisions.updated}`);
  console.log(`  Questions: +${questions.added} -${questions.deleted} ~${questions.updated}`);
}

const capability = process.argv[2];
const dateStamp = process.argv[3];
if (!capability || !dateStamp) {
  console.error('Usage: node Scripts/wbs-load-report-counts.js <capability> <dateStamp>');
  console.error('Example: node Scripts/wbs-load-report-counts.js PA 03-17-2026');
  process.exit(1);
}

run(capability, dateStamp);
