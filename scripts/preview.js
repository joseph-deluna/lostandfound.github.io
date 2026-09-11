import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root = resolve('dist'), prefix = '/lostandfound.github.io/';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff' };
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/' || url.pathname === prefix.slice(0, -1)) { res.writeHead(302, { Location: prefix }); return res.end(); }
    if (!url.pathname.startsWith(prefix)) { res.writeHead(404); return res.end('Not found'); }
    const path = resolve(root, decodeURIComponent(url.pathname.slice(prefix.length) || 'index.html'));
    if (!path.startsWith(root + '/')) { res.writeHead(403); return res.end(); }
    const content = await readFile(path); res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(content);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(4173, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:4173${prefix}`));
