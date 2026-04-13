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
 *
 * Redeploy: push under Capability-map/ or Project-Plan/ (see workflow), or run workflow_dispatch in Actions.
 *
 * GitHub API proxy (same-origin; avoids Confluence iframe CSP blocking api.github.com):
 *   POST /github-proxy/graphql  — JSON body { query, variables, github_token }; forwards to api.github.com/graphql
 *   GET|POST /github-api/...    — path must start with /orgs/, /repos/, or /projects/; pass GitHub PAT in X-GitHub-Token;
 *                                 query string is forwarded minus Lambda gate params (token, github_token, github_proxy)
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

function getRequestBody(event) {
  let b = event.body || '';
  if (event.isBase64Encoded && b) {
    try {
      b = Buffer.from(b, 'base64').toString('utf8');
    } catch {
      return '';
    }
  }
  return b;
}

function headerGet(headers, name) {
  if (!headers) return '';
  const lower = name.toLowerCase();
  for (const k of Object.keys(headers)) {
    if (k.toLowerCase() === lower) return headers[k] || '';
  }
  return '';
}

/**
 * Confluence iframes are often sandboxed with an opaque origin; fetches to the Lambda URL are then
 * cross-origin. Without these headers the browser hides the response → client sees "Failed to fetch".
 */
function corsHeadersForGithubProxy(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-GitHub-Token, Accept, X-GitHub-Api-Version, Authorization',
    'Access-Control-Max-Age': '3600',
    ...extra,
  };
}

function isGithubProxyPath(rawPath) {
  return rawPath === '/github-proxy/graphql' || rawPath.startsWith('/github-api/');
}

/** Strip Lambda/page gate params so they are not forwarded to api.github.com (noise; avoids leaking gate token in upstream logs). */
const GITHUB_REST_QUERY_STRIP = new Set(['token', 'github_token', 'github_proxy']);

function sanitizeGithubRestQueryString(rawQueryString) {
  if (!rawQueryString) return '';
  const sp = new URLSearchParams(rawQueryString);
  for (const k of [...sp.keys()]) {
    if (GITHUB_REST_QUERY_STRIP.has(k.toLowerCase())) sp.delete(k);
  }
  return sp.toString();
}

/** Only allow proxying to REST paths we need for org projects + issues (open proxy hardening). */
function isAllowedGithubRestPath(path) {
  if (!path || path.includes('..')) return false;
  return (
    /^\/orgs\/[^/]+/.test(path) ||
    /^\/repos\/[^/]+\/[^/]+/.test(path) ||
    /^\/projects\/\d+/.test(path) ||
    /^\/projects\/columns\/\d+/.test(path)
  );
}

async function handleGithubGraphqlProxy(event) {
  const ghTok = headerGet(event.headers, 'x-github-token');
  let payload;
  try {
    payload = JSON.parse(getRequestBody(event) || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: corsHeadersForGithubProxy({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ message: 'Invalid JSON body' }),
    };
  }
  const token = ghTok || payload.github_token;
  if (!token || typeof token !== 'string') {
    return {
      statusCode: 400,
      headers: corsHeadersForGithubProxy({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ message: 'Missing X-GitHub-Token header or github_token in body' }),
    };
  }
  const { query, variables } = payload;
  if (!query || typeof query !== 'string') {
    return {
      statusCode: 400,
      headers: corsHeadersForGithubProxy({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ message: 'Missing query' }),
    };
  }
  const forwardBody = JSON.stringify({ query, variables: variables ?? null });
  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'DMSI-Lambda-GitHub-Proxy',
      },
      body: forwardBody,
    });
    const text = await res.text();
    const outHeaders = corsHeadersForGithubProxy({
      'Content-Type': res.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store',
    });
    return { statusCode: res.status, headers: outHeaders, body: text };
  } catch (err) {
    const msg = err && err.message ? String(err.message) : String(err);
    return {
      statusCode: 502,
      headers: corsHeadersForGithubProxy({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        message:
          'Lambda proxy could not complete the GitHub GraphQL request (network or timeout). ' +
          msg,
      }),
    };
  }
}

async function handleGithubRestProxy(event) {
  const rawPath = event.rawPath || '/';
  const restPath = rawPath.replace(/^\/github-api/, '') || '/';
  if (!isAllowedGithubRestPath(restPath)) {
    return {
      statusCode: 400,
      headers: corsHeadersForGithubProxy({ 'Content-Type': 'text/plain' }),
      body: 'Disallowed GitHub API path',
    };
  }
  const ghTok = headerGet(event.headers, 'x-github-token');
  if (!ghTok) {
    return {
      statusCode: 400,
      headers: corsHeadersForGithubProxy({ 'Content-Type': 'text/plain' }),
      body: 'Missing X-GitHub-Token header',
    };
  }
  const method = (event.requestContext?.http?.method || event.httpMethod || 'GET').toUpperCase();
  const cleanQs = sanitizeGithubRestQueryString(event.rawQueryString || '');
  const qs = cleanQs ? `?${cleanQs}` : '';
  const url = `https://api.github.com${restPath}${qs}`;
  const headers = {
    Authorization: `Bearer ${ghTok}`,
    Accept: headerGet(event.headers, 'accept') || 'application/vnd.github+json',
    'X-GitHub-Api-Version': headerGet(event.headers, 'x-github-api-version') || '2022-11-28',
    'User-Agent': 'DMSI-Lambda-GitHub-Proxy',
  };
  const init = { method, headers };
  if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
    init.body = getRequestBody(event);
    const ct = headerGet(event.headers, 'content-type');
    if (ct) init.headers['Content-Type'] = ct;
  }
  const res = await fetch(url, init);
  const text = await res.text();
  const outHeaders = corsHeadersForGithubProxy({
    'Content-Type': res.headers.get('content-type') || 'application/json',
    'Cache-Control': 'no-store',
  });
  const link = res.headers.get('link');
  if (link) outHeaders.Link = link;
  return { statusCode: res.status, headers: outHeaders, body: text };
}

export const handler = async (event) => {
  const rawPath = event.rawPath || '/';
  const method = (event.requestContext?.http?.method || event.httpMethod || 'GET').toUpperCase();
  const proxyPath = isGithubProxyPath(rawPath);

  if (method === 'OPTIONS' && proxyPath) {
    if (!isAllowed(event)) {
      return {
        statusCode: 403,
        headers: corsHeadersForGithubProxy({ 'Content-Type': 'text/plain; charset=utf-8' }),
        body: 'Forbidden',
      };
    }
    return { statusCode: 204, headers: corsHeadersForGithubProxy(), body: '' };
  }

  if (!isAllowed(event)) {
    const denyHeaders = proxyPath
      ? corsHeadersForGithubProxy({ 'Content-Type': 'text/html; charset=utf-8' })
      : { 'Content-Type': 'text/html; charset=utf-8' };
    return {
      statusCode: 403,
      headers: denyHeaders,
      body: '<!DOCTYPE html><html><body><h1>Access denied</h1><p>This page is only available when opened from an allowed referrer or with a valid token.</p></body></html>',
    };
  }

  if (rawPath === '/github-proxy/graphql' && method === 'POST') {
    return handleGithubGraphqlProxy(event);
  }
  if (rawPath.startsWith('/github-api/')) {
    return handleGithubRestProxy(event);
  }
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
