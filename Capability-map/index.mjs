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
 * Allowed Confluence base URL for iframe access.
 * Set env ALLOWED_REFERER_PREFIX in Lambda (e.g. https://yoursite.atlassian.net/)
 * Requests without this Referer get 403 (e.g. direct link to Lambda URL).
 */
const ALLOWED_REFERER_PREFIX = process.env.ALLOWED_REFERER_PREFIX || '';

function isAllowedReferer(event) {
  if (!ALLOWED_REFERER_PREFIX) return true; // no restriction if not set
  const referer = event.headers?.referer || event.headers?.Referer || '';
  return referer.startsWith(ALLOWED_REFERER_PREFIX);
}

export const handler = async (event) => {
  // Restrict access to Confluence iframe only (block direct visits to Lambda URL)
  if (!isAllowedReferer(event)) {
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
