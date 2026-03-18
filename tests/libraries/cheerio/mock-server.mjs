import http from 'node:http';

const PORT = 18080;

const send = (res, status, body, headers) => {
  res.writeHead(status, headers);
  res.end(body);
};

const sendJson = (res, status, payload) => {
  send(res, status, JSON.stringify(payload), { 'content-type': 'application/json' });
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const key = `${req.method} ${url.pathname}`;

  if (key === 'GET /health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (key === 'GET /page') {
    send(
      res,
      200,
      '<!doctype html><html><body><h1>Mock Title</h1><a class="next" href="/docs/start">Next</a><div id="count">42</div></body></html>',
      { 'content-type': 'text/html; charset=utf-8' }
    );
    return;
  }

  if (key === 'GET /feed.xml') {
    send(
      res,
      200,
      '<?xml version="1.0" encoding="utf-8"?><feed><entry><title>first</title></entry><entry><title>second</title></entry></feed>',
      { 'content-type': 'application/xml; charset=utf-8' }
    );
    return;
  }

  if (key === 'GET /api/json') {
    sendJson(res, 200, { ok: true, note: 'not html/xml' });
    return;
  }

  sendJson(res, 404, { error: 'Not Found', path: url.pathname });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
