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

  if (req.method === 'GET' && url.pathname === '/v1/voices') {
    sendJson(res, 200, {
      voices: [
        {
          languageCodes: ['en-US'],
          name: 'en-US-Standard-A',
          ssmlGender: 'FEMALE',
          naturalSampleRateHertz: 24000,
        },
      ],
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/v1/text:synthesize') {
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

      if (parsedBody?.input?.text === 'trigger-error') {
        sendJson(res, 500, { error: { code: 500, message: 'mock synthesize failure' } });
        return;
      }

      sendJson(res, 200, {
        audioContent: 'AQIDBA==',
      });
    });
    return;
  }

  sendJson(res, 404, { error: 'Not Found', method: req.method, path: url.pathname });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
