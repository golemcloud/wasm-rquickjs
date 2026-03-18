import http from 'node:http';

const PORT = 18080;

const state = {
  events: [],
};

function parseEnvelope(rawBody) {
  const lines = rawBody.split('\n');

  if (lines.length < 3) {
    return { rawBody };
  }

  try {
    const itemHeader = JSON.parse(lines[1]);
    if (itemHeader.type !== 'event') {
      return { rawBody, itemType: itemHeader.type };
    }

    const event = JSON.parse(lines[2]);
    return { rawBody, event };
  } catch {
    return { rawBody };
  }
}

const routes = {
  'GET /health': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  },
  'POST /api/reset': (req, res) => {
    state.events.length = 0;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  },
  'GET /api/events': (req, res) => {
    const last = state.events[state.events.length - 1];
    const lastEvent = last?.event;
    const lastMessage = lastEvent?.message ?? null;
    const lastExceptionValue = lastEvent?.exception?.values?.[0]?.value ?? null;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      count: state.events.length,
      lastMessage,
      lastExceptionValue,
    }));
  },
  'POST /api/1/envelope/': (req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString('utf-8');
    });
    req.on('end', () => {
      state.events.push(parseEnvelope(body));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{}');
    });
  },
};

const server = http.createServer((req, res) => {
  const key = `${req.method} ${req.url.split('?')[0]}`;
  const handler = routes[key];

  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found', path: req.url }));
    return;
  }

  handler(req, res);
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
