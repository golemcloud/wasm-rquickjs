import http from 'node:http';

const PORT = 18080;
let retryAttemptCount = 0;

const sendJson = (res, status, payload, extraHeaders = {}) => {
  res.writeHead(status, {
    'content-type': 'application/json',
    'x-request-id': `req_mock_${Date.now()}`,
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
};

const readBody = (req) =>
  new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const key = `${req.method} ${url.pathname}`;

  if (key === 'GET /health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (key === 'GET /v1/models') {
    sendJson(res, 200, {
      object: 'list',
      data: [
        {
          id: 'gpt-mock-1',
          object: 'model',
          created: 0,
          owned_by: 'openai',
        },
      ],
    });
    return;
  }

  if (key === 'POST /v1/chat/completions') {
    const raw = await readBody(req);
    const body = raw ? JSON.parse(raw) : {};
    const userContent = body?.messages?.find((m) => m.role === 'user')?.content ?? '';

    if (typeof userContent === 'string' && userContent.includes('TRIGGER_RETRY')) {
      retryAttemptCount += 1;
      if (retryAttemptCount === 1) {
        sendJson(
          res,
          429,
          {
            error: {
              message: 'rate limited for test',
              type: 'rate_limit_error',
            },
          },
          { 'retry-after-ms': '1' }
        );
        return;
      }
    }

    sendJson(res, 200, {
      id: 'chatcmpl-mock',
      object: 'chat.completion',
      created: 0,
      model: body?.model ?? 'gpt-4o-mini',
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: 'MOCK_CHAT_OK' },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 4,
        completion_tokens: 2,
        total_tokens: 6,
      },
    });
    return;
  }

  if (key === 'POST /v1/embeddings') {
    const raw = await readBody(req);
    const body = raw ? JSON.parse(raw) : {};

    sendJson(res, 200, {
      object: 'list',
      data: [
        {
          object: 'embedding',
          index: 0,
          embedding: [0.125, -0.5, 0.875],
        },
      ],
      model: body?.model ?? 'text-embedding-3-small',
      usage: {
        prompt_tokens: 3,
        total_tokens: 3,
      },
    });
    return;
  }

  sendJson(res, 404, { error: 'Not Found', path: url.pathname });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
