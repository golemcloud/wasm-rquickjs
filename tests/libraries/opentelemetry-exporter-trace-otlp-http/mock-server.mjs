import http from 'node:http';
import zlib from 'node:zlib';

const PORT = 18080;
const requests = [];

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const normalizeHeaders = (headers) => {
  const normalized = {};
  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      normalized[key] = value.join(', ');
    } else if (typeof value === 'string') {
      normalized[key] = value;
    }
  }
  return normalized;
};

const decodeBody = (buffer, headers) => {
  const encoding = headers['content-encoding'];
  if (encoding === 'gzip') {
    return zlib.gunzipSync(buffer).toString('utf8');
  }
  return buffer.toString('utf8');
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/__reset') {
    requests.length = 0;
    sendJson(res, 200, { status: 'reset' });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/__requests') {
    sendJson(res, 200, { requests });
    return;
  }

  if (req.method === 'POST') {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      const headers = normalizeHeaders(req.headers);

      requests.push({
        method: req.method,
        path: url.pathname,
        headers,
        decodedBody: decodeBody(body, headers),
        rawBodyLength: body.length,
      });

      sendJson(res, 200, { partialSuccess: {} });
    });
    return;
  }

  sendJson(res, 404, { error: 'Not Found', path: url.pathname });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
