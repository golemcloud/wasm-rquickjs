import http from 'node:http';

const PORT = 18080;

const sendJson = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/v2/projects/test-project/locations/us-central1/config') {
    sendJson(res, 200, {
      name: 'projects/test-project/locations/us-central1/config',
      adaptation: {},
    });
    return;
  }

  if (req.method === 'POST' && url.pathname.endsWith(':recognize')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      let parsedBody = {};
      try {
        parsedBody = JSON.parse(body || '{}');
      } catch (_error) {
        sendJson(res, 400, { error: { code: 400, message: 'invalid JSON body' } });
        return;
      }

      if (url.pathname.includes('recognizers/trigger-error')) {
        sendJson(res, 500, { error: { code: 500, message: 'mock recognize failure' } });
        return;
      }

      sendJson(res, 200, {
        results: [
          {
            alternatives: [
              {
                transcript: 'mock transcript',
                confidence: 0.99,
              },
            ],
            languageCode: parsedBody?.config?.languageCodes?.[0] ?? 'en-US',
          },
        ],
        metadata: {
          requestId: 'mock-request-id',
        },
      });
    });
    return;
  }

  sendJson(res, 404, { error: 'Not Found', method: req.method, path: url.pathname });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
