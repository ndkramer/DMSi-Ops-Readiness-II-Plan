#!/usr/bin/env node
/**
 * Copies *-outcomes.json into embedded #*-outcomes-fallback blocks in Outcome Map HTML
 * so file:// opens stay in sync after JSON edits.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
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
