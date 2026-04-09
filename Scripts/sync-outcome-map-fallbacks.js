#!/usr/bin/env node
/**
 * (1) Copies *-outcomes.json into embedded #*-outcomes-fallback blocks in Outcome Map HTML
 *     so file:// opens stay in sync after JSON edits.
 * (2) Re-inlines Project-Plan/outcome-map-from-json.js into the same HTML files when you
 *     change the shared loader (keeps Outcome Maps self-contained for file://).
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const loaderPath = path.join(root, 'Project-Plan/outcome-map-from-json.js');
let loaderBody = fs.readFileSync(loaderPath, 'utf8').replace(/^\/\*\*[\s\S]*?\*\/\s*/, '').trim();
const inlineLoader = `<script>
/* Inlined from Project-Plan/outcome-map-from-json.js — edit that file then run this script. */
${loaderBody}
</script>`;

const htmlWithLoader = [
  'WSA/WM/WM-Outcome-Map.html',
  'WSA/PA/PA-Outcome-map.html',
  'WSA/VI/VI-WSB-Outcome-Map.html',
  'WSB-WSC/WB/WB-Outcome-Map.html'
];

const loaderRe = /<script>\n\/\* Inlined from Project-Plan\/outcome-map-from-json\.js[\s\S]*?<\/script>/m;

for (const htmlRel of htmlWithLoader) {
  const htmlPath = path.join(root, htmlRel);
  if (!fs.existsSync(htmlPath)) continue;
  let html = fs.readFileSync(htmlPath, 'utf8');
  if (!loaderRe.test(html)) {
    console.warn('skip loader (no inlined block):', htmlRel);
    continue;
  }
  html = html.replace(loaderRe, inlineLoader);
  fs.writeFileSync(htmlPath, html);
  console.log('ok loader', htmlRel);
}

const pairs = [
  { json: 'WSA/WM/wm-outcomes.json', html: 'WSA/WM/WM-Outcome-Map.html', id: 'wm-outcomes-fallback' },
  { json: 'WSA/VI/vi-outcomes.json', html: 'WSA/VI/VI-WSB-Outcome-Map.html', id: 'vi-outcomes-fallback' },
  { json: 'WSB-WSC/WB/wb-outcomes.json', html: 'WSB-WSC/WB/WB-Outcome-Map.html', id: 'wb-outcomes-fallback' }
];

for (const { json: jsonRel, html: htmlRel, id } of pairs) {
  const jsonPath = path.join(root, jsonRel);
  const htmlPath = path.join(root, htmlRel);
  if (!fs.existsSync(jsonPath) || !fs.existsSync(htmlPath)) continue;
  const jsonRaw = fs.readFileSync(jsonPath, 'utf8').trim();
  let html = fs.readFileSync(htmlPath, 'utf8');
  const re = new RegExp(
    `<script type="application/json" id="${id}">[\\s\\S]*?</script>`,
    'm'
  );
  if (!re.test(html)) {
    console.warn('skip (no block):', id, htmlRel);
    continue;
  }
  html = html.replace(re, `<script type="application/json" id="${id}">\n${jsonRaw}\n</script>`);
  fs.writeFileSync(htmlPath, html);
  console.log('ok', id);
}
