import http from 'node:http';

const PORT = 18080;

const classes = new Map([
  ['Book', { class: 'Book', properties: [{ name: 'title', dataType: ['text'] }] }],
]);
const objects = new Map();
let generatedId = 1;

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const notFound = (res, path) => sendJson(res, 404, { error: 'Not Found', path });

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (req.method === 'GET' && path === '/health') {
    return sendJson(res, 200, { status: 'ok' });
  }

  if (req.method === 'GET' && path === '/v1/meta') {
    return sendJson(res, 200, {
      version: '1.32.0',
      grpcMaxMessageSize: 104858000,
      modules: {},
    });
  }

  if (req.method === 'GET' && path === '/v1/.well-known/live') {
    res.writeHead(200);
    res.end('');
    return;
  }

  if (req.method === 'GET' && path === '/v1/.well-known/ready') {
    res.writeHead(200);
    res.end('');
    return;
  }

  if (req.method === 'GET' && path === '/v1/schema') {
    return sendJson(res, 200, { classes: Array.from(classes.values()) });
  }

  if (req.method === 'POST' && path === '/v1/objects') {
    try {
      const payload = await readBody(req);
      const className = payload.class || 'Book';
      const id = payload.id || `mock-id-${generatedId++}`;
      objects.set(`${className}:${id}`, payload.properties || {});
      return sendJson(res, 200, { id });
    } catch {
      return sendJson(res, 400, { error: 'Invalid JSON body' });
    }
  }

  if (req.method === 'HEAD' && path.startsWith('/v1/objects/')) {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 4) {
      const className = segments[2];
      const id = segments[3];
      if (objects.has(`${className}:${id}`)) {
        res.writeHead(200);
        res.end('');
      } else {
        res.writeHead(404);
        res.end('');
      }
      return;
    }

    if (segments.length === 3) {
      const id = segments[2];
      const exists = Array.from(objects.keys()).some((key) => key.endsWith(`:${id}`));
      res.writeHead(exists ? 200 : 404);
      res.end('');
      return;
    }
  }

  notFound(res, path);
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
