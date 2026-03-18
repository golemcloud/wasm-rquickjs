import http from 'node:http';

const PORT = 18080;

const readBody = (req) =>
  new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
  });

const json = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const key = `${req.method} ${path}`;

  if (key === 'GET /health') {
    return json(res, 200, { status: 'ok' });
  }

  if (key === 'POST /v1/listen') {
    const body = await readBody(req);
    const parsed = body ? JSON.parse(body) : {};
    if (!parsed.url) {
      return json(res, 400, { err_code: 'bad_request', err_msg: 'url is required' });
    }

    return json(res, 200, {
      metadata: { request_id: 'listen-req-1' },
      results: {
        channels: [
          {
            alternatives: [
              {
                transcript: `mock transcript for ${url.searchParams.get('model') || 'unknown-model'}`,
                confidence: 0.99,
              },
            ],
          },
        ],
      },
    });
  }

  if (key === 'POST /v1/read') {
    const body = await readBody(req);
    const parsed = body ? JSON.parse(body) : {};
    if (!parsed.text) {
      return json(res, 400, { err_code: 'bad_request', err_msg: 'text is required' });
    }

    return json(res, 200, {
      metadata: { request_id: 'read-req-1' },
      results: {
        summary: { text: `summary:${parsed.text.slice(0, 12)}` },
      },
    });
  }

  if (key === 'POST /v1/speak') {
    const body = await readBody(req);
    const parsed = body ? JSON.parse(body) : {};
    if (!parsed.text) {
      return json(res, 400, { err_code: 'bad_request', err_msg: 'text is required' });
    }

    const audio = new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4]);
    res.writeHead(200, { 'Content-Type': 'audio/wav' });
    res.end(audio);
    return;
  }

  if (key === 'POST /v1/auth/grant') {
    return json(res, 200, {
      access_token: 'mock-access-token',
      expires_in: 30,
    });
  }

  if (key === 'GET /v1/models') {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Token ')) {
      return json(res, 401, { err_code: 'unauthorized', err_msg: 'missing authorization' });
    }

    return json(res, 200, [
      { model_uuid: 'model-1', name: 'nova-3' },
      { model_uuid: 'model-2', name: 'aura-2-thalia-en' },
    ]);
  }

  return json(res, 404, { error: 'Not Found', path });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
