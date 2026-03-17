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

export const handler = async (event) => {
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
