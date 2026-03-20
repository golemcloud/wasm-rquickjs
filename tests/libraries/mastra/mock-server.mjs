import http from 'node:http';
import { gunzipSync } from 'node:zlib';

const PORT = 18080;
const events = [];

const sendJson = (res, statusCode, body) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/events') {
    sendJson(res, 200, { count: events.length, events });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/reset') {
    events.length = 0;
    sendJson(res, 200, { status: 'reset' });
    return;
  }

  if (req.method === 'POST' && (url.pathname === '/batch/' || url.pathname === '/capture/')) {
    const chunks = [];

    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks);
        const decoded = req.headers['content-encoding'] === 'gzip'
          ? gunzipSync(raw).toString('utf8')
          : raw.toString('utf8');

        const payload = JSON.parse(decoded || '{}');
        if (Array.isArray(payload.batch)) {
          for (const event of payload.batch) {
            events.push(event);
          }
        } else {
          events.push(payload);
        }

        sendJson(res, 200, { status: 1 });
      } catch (error) {
        sendJson(res, 400, { error: String(error) });
      }
    });
    return;
  }

  sendJson(res, 404, { error: 'Not Found', path: url.pathname });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
