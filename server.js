const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const frontendPath = path.join(__dirname, 'frontend');
const port = Number(process.env.PORT) || 3000;
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Requisição inválida.');
    return;
  }

  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.resolve(frontendPath, `.${requestedPath}`);
  if (!filePath.startsWith(`${frontendPath}${path.sep}`)) {
    response.writeHead(403).end('Acesso negado.');
    return;
  }

  fs.readFile(filePath, (error, contents) => {
    if (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Arquivo não encontrado.');
      return;
    }
    response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    response.end(contents);
  });
});

server.listen(port, () => {
  console.log(`Foto Celera disponível em http://localhost:${port}`);
});