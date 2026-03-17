#!/usr/bin/env node
/**
 * WBS Load Prep: archive current WBS and Jira-import JSON, create WBS-Load report stub.
 *
 * Part of the WBS update pattern. Run before reviewing Input and regenerating the WBS.
 * - Copies current WBS to {Folder}/Archive/{Prefix}-WSB-mm-dd-yyyy.md
 * - If present, copies Output Jira-import JSON to {Folder}/Output/Archive/{Prefix}-WSB-Jira-Import-mm-dd-yyyy.json
 * - Creates {Folder}/Update-Reports/WBS-Load-mm-dd-yyyy.md with stub sections (including archived JSON path)
 *
 * Run from project root: node Scripts/wbs-load-prep.js <capability>
 * Example: node Scripts/wbs-load-prep.js PA
 *
 * Capability: folder name and prefix (e.g. PA, VI, WM). Uses same date for all archives in one run.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

function getDateStamp() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function run(capability) {
  const prefix = capability;
  const folderPath = path.join(PROJECT_ROOT, capability);
  const dateStamp = getDateStamp();

  if (!fs.existsSync(folderPath)) {
    console.error(`Capability folder not found: ${folderPath}`);
    process.exit(1);
  }

  const wbsName = `${prefix}-WSB.md`;
  const wbsPath = path.join(folderPath, wbsName);
  const archiveDir = path.join(folderPath, 'Archive');
  const archivedWbsName = `${prefix}-WSB-${dateStamp}.md`;
  const archivedWbsPath = path.join(archiveDir, archivedWbsName);

  const jsonName = `${prefix}-WSB-Jira-Import.json`;
  const jsonPath = path.join(folderPath, 'Output', jsonName);
  const outputArchiveDir = path.join(folderPath, 'Output', 'Archive');
  const archivedJsonName = `${prefix}-WSB-Jira-Import-${dateStamp}.json`;
  const archivedJsonPath = path.join(outputArchiveDir, archivedJsonName);

  const updateReportsDir = path.join(folderPath, 'Update-Reports');
  const reportName = `WBS-Load-${dateStamp}.md`;
  const reportPath = path.join(updateReportsDir, reportName);

  let jsonArchived = null;

  // 1. Archive WBS
  if (!fs.existsSync(wbsPath)) {
    console.error(`WBS not found: ${wbsPath}`);
    process.exit(1);
  }
  ensureDir(archiveDir);
  fs.copyFileSync(wbsPath, archivedWbsPath);
  console.log(`Archived WBS: ${capability}/Archive/${archivedWbsName}`);

  // 2. Archive Jira-import JSON if present
  if (fs.existsSync(jsonPath)) {
    ensureDir(outputArchiveDir);
    fs.copyFileSync(jsonPath, archivedJsonPath);
    jsonArchived = `${capability}/Output/Archive/${archivedJsonName}`;
    console.log(`Archived Jira import JSON: ${jsonArchived}`);
  } else {
    console.log(`No Jira import JSON at ${capability}/Output/${jsonName}; skip archive.`);
  }

  // 3. Create WBS-Load report stub
  ensureDir(updateReportsDir);
  const reportStub = `# WBS Load Report: ${capability} — ${dateStamp}

## Summary

- **WBS archived:** \`${capability}/Archive/${archivedWbsName}\`
${jsonArchived ? `- **Jira import JSON archived:** \`${jsonArchived}\`` : '- **Jira import JSON:** not present for this capability (no archive created).'}
- **Report generated:** ${new Date().toISOString().slice(0, 10)}

## Outcome map / constraint map changes

(After reviewing Input vs current WBS and maps, document material changes here.)

## Risks, decisions, questions

(Note any changes to Risks (with Type 1/Type 2 where applicable), Decisions, Open Questions.)

## Keys added / updated / removed

(Note WBS key changes: outcomes, deliverables, risks, decisions, questions.)

## Other substantial changes

(Any other material updates from this load.)

## Next steps

- **Regenerate WBS** from Input and current maps; preserve structure and key conventions.
- **Regenerate Jira import JSON** from the updated WBS (manual step until a generator exists). Update \`${capability}/Output/${jsonName}\` so it reflects current work_items and action_items keyed by WBS IDs; this file is used by the future Jira upload process.
`;

  fs.writeFileSync(reportPath, reportStub, 'utf8');
  console.log(`Created report stub: ${capability}/Update-Reports/${reportName}`);
}

const capability = process.argv[2];
if (!capability) {
  console.error('Usage: node Scripts/wbs-load-prep.js <capability>');
  console.error('Example: node Scripts/wbs-load-prep.js PA');
  process.exit(1);
}

run(capability);
