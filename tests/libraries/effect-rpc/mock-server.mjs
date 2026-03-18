import http from 'node:http';

const PORT = 18080;

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', reject);
  });

const toHeadersObject = (headersArray) => {
  const out = Object.create(null);
  for (const [name, value] of headersArray || []) {
    out[String(name).toLowerCase()] = String(value);
  }
  return out;
};

const successExit = (requestId, value) => ({
  _tag: 'Exit',
  requestId,
  exit: {
    _tag: 'Success',
    value,
  },
});

const routes = {
  'GET /health': async (_req) => ({
    status: 200,
    body: { status: 'ok' },
  }),
  'POST /rpc': async (req) => {
    const raw = await readBody(req);
    const message = JSON.parse(raw || '{}');

    if (message._tag !== 'Request') {
      return {
        status: 400,
        body: [
          {
            _tag: 'Defect',
            defect: {
              _tag: 'RuntimeException',
              message: 'Expected Request message',
            },
          },
        ],
      };
    }

    const requestId = String(message.id);
    const payload = message.payload || {};
    const headers = toHeadersObject(message.headers);

    switch (message.tag) {
      case 'Echo':
        return {
          status: 200,
          body: [successExit(requestId, `echo:${payload.message}`)],
        };
      case 'HeaderEcho':
        return {
          status: 200,
          body: [successExit(requestId, headers[(payload.key || '').toLowerCase()] || 'missing')],
        };
      case 'math.Add':
        return {
          status: 200,
          body: [successExit(requestId, Number(payload.a) + Number(payload.b))],
        };
      default:
        return {
          status: 404,
          body: [successExit(requestId, 'unknown-tag')],
        };
    }
  },
};

const server = http.createServer(async (req, res) => {
  const key = `${req.method} ${req.url.split('?')[0]}`;
  const route = routes[key];

  if (!route) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found', path: req.url }));
    return;
  }

  try {
    const result = await route(req);
    res.writeHead(result.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result.body));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(error?.message || error) }));
  }
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
