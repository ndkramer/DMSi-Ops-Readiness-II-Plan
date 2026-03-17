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
    const content = readFileSync(join(__dirname, filePath), 'utf8');
    return { statusCode: 200, headers: { 'Content-Type': contentType }, body: content };
  } catch {
    return { statusCode: 404, body: 'Not found' };
  }
};
