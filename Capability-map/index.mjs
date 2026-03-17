import { readFileSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONTENT_TYPES = {
  '.html': 'text/html',
  '.json': 'application/json',
  '.js':   'application/javascript',
  '.css':  'text/css',
};

/**
 * Access control: allow only Confluence iframe (or same-origin subrequests).
 *
 * Set in Lambda env:
 *   CONFLUENCE_TOKEN     - Secret; use in iframe URL: ?token=<this-value>
 *   ALLOWED_REFERER_PREFIX - Optional; Confluence base URL (e.g. https://yoursite.atlassian.net/)
 *   LAMBDA_URL_PREFIX    - This Lambda's URL with trailing slash (for in-iframe fetches)
 */
const CONFLUENCE_TOKEN = process.env.CONFLUENCE_TOKEN || '';
const ALLOWED_REFERER_PREFIX = process.env.ALLOWED_REFERER_PREFIX || '';
const LAMBDA_URL_PREFIX = process.env.LAMBDA_URL_PREFIX || '';

function isAllowed(event) {
  const referer = event.headers?.referer || event.headers?.Referer || '';
  const token = event.queryStringParameters?.token;

  if (CONFLUENCE_TOKEN && token === CONFLUENCE_TOKEN) return true;
  if (ALLOWED_REFERER_PREFIX && referer.startsWith(ALLOWED_REFERER_PREFIX)) return true;
  if (LAMBDA_URL_PREFIX && referer.startsWith(LAMBDA_URL_PREFIX)) return true;

  if (!CONFLUENCE_TOKEN && !ALLOWED_REFERER_PREFIX && !LAMBDA_URL_PREFIX) return true;
  return false;
}

export const handler = async (event) => {
  if (!isAllowed(event)) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: '<!DOCTYPE html><html><body><h1>Access denied</h1><p>This page is only available when opened from the Confluence Capability Map.</p></body></html>',
    };
  }

  const rawPath = event.rawPath || '/';
  const filePath = rawPath === '/' ? '/capability-map.html' : rawPath;
  const ext = extname(filePath);
  const contentType = CONTENT_TYPES[ext] || 'text/plain';

  try {
    // Resolve path relative to this script (no leading slash so join works in Lambda)
    const resolved = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const content = readFileSync(join(__dirname, resolved), 'utf8');
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, max-age=0',
    };
    return { statusCode: 200, headers, body: content };
  } catch {
    return { statusCode: 404, body: 'Not found' };
  }
};
