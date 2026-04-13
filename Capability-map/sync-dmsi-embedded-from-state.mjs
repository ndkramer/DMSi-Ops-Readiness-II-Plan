#!/usr/bin/env node
/**
 * Rewrites `var EMBEDDED_STATE = …` in capability-map.html and capability-map-dmsi.html from
 * capability-map-state.json so offline / fallback matches the JSON (including blockers).
 * Run after editing capability-map-state.json.
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const jsonPath = join(__dirname, 'capability-map-state.json');

const j = readFileSync(jsonPath, 'utf8');
JSON.parse(j);
const embedded = 'var EMBEDDED_STATE = ' + JSON.stringify(JSON.parse(j), null, 2) + ';\n';

const endAnchor = '\nfunction getStageArrays';

for (const name of ['capability-map.html', 'capability-map-dmsi.html']) {
  const htmlPath = join(__dirname, name);
  const html = readFileSync(htmlPath, 'utf8');
  const start = html.indexOf('var EMBEDDED_STATE = ');
  const end = html.indexOf(endAnchor, start);
  if (start < 0 || end < 0) {
    console.error('Could not find EMBEDDED_STATE or getStageArrays in', name);
    process.exit(1);
  }
  writeFileSync(htmlPath, html.slice(0, start) + embedded + html.slice(end));
  console.log('Updated EMBEDDED_STATE in', name);
}
