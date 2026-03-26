#!/usr/bin/env node
/**
 * WBS Move Input to Archive: move processed Input files to Input/Archive/{dateStamp}/
 *
 * Run after processing is complete (read Input, update/map WBS, fill report). Moves
 * all files from {Folder}/Input/ to {Folder}/Input/Archive/{dateStamp}/ so they are
 * marked as processed. Use the same dateStamp as the WBS-Load report for this run.
 * **WB** resolves to `WSB-WSC/WB` via `wbs-capability-folder.js`.
 *
 * Run from project root: node Scripts/wbs-move-input-to-archive.js <capability> <dateStamp>
 * Example: node Scripts/wbs-move-input-to-archive.js PA 03-17-2026
 */

const fs = require('fs');
const path = require('path');
const { getCapabilityFolder, capabilityFolderDisplay } = require('./wbs-capability-folder');

function run(capability, dateStamp) {
  const folderPath = getCapabilityFolder(capability);
  const folderLabel = capabilityFolderDisplay(capability);
  const inputDir = path.join(folderPath, 'Input');
  const archiveDir = path.join(inputDir, 'Archive', dateStamp);

  if (!fs.existsSync(folderPath)) {
    console.error(`Capability folder not found: ${folderPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(inputDir)) {
    console.error(`Input folder not found: ${inputDir}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(inputDir, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile() && !e.name.startsWith('.'));
  if (files.length === 0) {
    console.log('No files to move.');
    return;
  }

  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  for (const f of files) {
    const src = path.join(inputDir, f.name);
    const dest = path.join(archiveDir, f.name);
    fs.renameSync(src, dest);
    console.log(`Moved ${f.name} to ${folderLabel}/Input/Archive/${dateStamp}/`);
  }
}

const capability = process.argv[2];
const dateStamp = process.argv[3];
if (!capability || !dateStamp) {
  console.error('Usage: node Scripts/wbs-move-input-to-archive.js <capability> <dateStamp>');
  console.error('Example: node Scripts/wbs-move-input-to-archive.js PA 03-17-2026');
  process.exit(1);
}

run(capability, dateStamp);
