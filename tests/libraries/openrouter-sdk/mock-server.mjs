import http from 'node:http';

const PORT = 18083;

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const key = `${req.method} ${url.pathname}`;

  if (key === 'GET /health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (key === 'POST /api/v1/chat/completions') {
    const body = await readJsonBody(req);
    if (
      req.headers.authorization !== 'Bearer sk-test'
      || body.model !== 'openai/gpt-test'
      || body.messages?.[0]?.content !== 'Hello'
    ) {
      sendJson(res, 400, { error: 'unexpected request' });
      return;
    }

    sendJson(res, 200, {
      choices: [{
        finish_reason: 'stop',
        index: 0,
        message: {
          content: 'offline reply',
          role: 'assistant',
        },
      }],
      created: 1,
      id: 'generation-test',
      model: 'openai/gpt-test',
      object: 'chat.completion',
      system_fingerprint: null,
    });
    return;
  }

  sendJson(res, 404, { error: 'not found', method: req.method, path: url.pathname });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
