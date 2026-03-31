/**
 * AWS Lambda Function URL handler: serve static files co-located with this script.
 *
 * Canonical source: dynamo-os/planning-toolkit/lambda/static-handler/index.mjs — copy from there when updating.
 *
 * Env (optional access control — same as legacy DMSI handler):
 *   CONFLUENCE_TOKEN       — ?token= must match for access
 *   ALLOWED_REFERER_PREFIX — Referer must start with this (e.g. Confluence site)
 *   LAMBDA_URL_PREFIX      — Referer may start with this function URL
 *
 *   LAMBDA_INDEX — Filename served for GET / (default: capability-map.html for DMSI;
 *                 set to index.html for greenfield sites)
 */
import { readFileSync } from 'fs';
import { dirname, extname, resolve, relative, sep } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
};

/** Extensions served as raw bytes with isBase64Encoded (Lambda Function URL / API GW). */
function isBinaryExtension(ext) {
  return ['.png', '.ico', '.gif', '.jpg', '.jpeg', '.webp', '.woff', '.woff2', '.pdf'].includes(ext);
}

const CONFLUENCE_TOKEN = process.env.CONFLUENCE_TOKEN || '';
const ALLOWED_REFERER_PREFIX = process.env.ALLOWED_REFERER_PREFIX || '';
const LAMBDA_URL_PREFIX = process.env.LAMBDA_URL_PREFIX || '';

function indexFile() {
  const s = (process.env.LAMBDA_INDEX || 'capability-map.html').replace(/^[/\\]+/, '');
  if (s.includes('..')) return 'capability-map.html';
  return s;
}

function isAllowed(event) {
  const referer = event.headers?.referer || event.headers?.Referer || '';
  const token = event.queryStringParameters?.token;

  if (CONFLUENCE_TOKEN && token === CONFLUENCE_TOKEN) return true;
  if (ALLOWED_REFERER_PREFIX && referer.startsWith(ALLOWED_REFERER_PREFIX)) return true;
  if (LAMBDA_URL_PREFIX && referer.startsWith(LAMBDA_URL_PREFIX)) return true;

  if (!CONFLUENCE_TOKEN && !ALLOWED_REFERER_PREFIX && !LAMBDA_URL_PREFIX) return true;
  return false;
}

/** Resolve safe path under __dirname; returns null if traversal escapes bundle root. */
function safeBundlePath(relativePath) {
  const base = resolve(__dirname);
  const rel = relativePath.replace(/^\/+/, '');
  const full = resolve(base, rel);
  const under = relative(base, full);
  if (under.startsWith('..') || under.split(sep).includes('..')) return null;
  return full;
}

export const handler = async (event) => {
  if (!isAllowed(event)) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: '<!DOCTYPE html><html><body><h1>Access denied</h1><p>This page is only available when opened from an allowed referrer or with a valid token.</p></body></html>',
    };
  }

  const rawPath = event.rawPath || '/';
  const logicalPath = rawPath === '/' ? `/${indexFile()}` : rawPath;
  const ext = extname(logicalPath);
  const contentType = CONTENT_TYPES[ext] || 'text/plain; charset=utf-8';

  const fullPath = safeBundlePath(logicalPath);
  if (!fullPath) {
    return { statusCode: 400, headers: { 'Content-Type': 'text/plain' }, body: 'Bad path' };
  }

  try {
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, max-age=0',
    };
    if (isBinaryExtension(ext)) {
      const buf = readFileSync(fullPath);
      return {
        statusCode: 200,
        headers,
        body: buf.toString('base64'),
        isBase64Encoded: true,
      };
    }
    const content = readFileSync(fullPath, 'utf8');
    return { statusCode: 200, headers, body: content };
  } catch {
    return { statusCode: 404, headers: { 'Content-Type': 'text/plain' }, body: 'Not found' };
  }
};
