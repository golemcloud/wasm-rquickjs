import http from 'node:http';

const PORT = 18080;

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });

const getUserPrompt = (requestBody) => {
  const messages = Array.isArray(requestBody?.messages) ? requestBody.messages : [];
  const userMessage = messages.find((m) => m?.role === 'user');
  if (!userMessage) return '';
  if (typeof userMessage.content === 'string') return userMessage.content;
  if (Array.isArray(userMessage.content)) {
    const textPart = userMessage.content.find((part) => part?.type === 'text' && typeof part?.text === 'string');
    return textPart?.text ?? '';
  }
  return '';
};

const server = http.createServer(async (req, res) => {
  const path = req.url?.split('?')[0] ?? '/';

  if (req.method === 'GET' && path === '/health') {
    return sendJson(res, 200, { status: 'ok' });
  }

  if (req.method === 'POST' && path === '/v1/chat/completions') {
    const body = await readBody(req);
    const requestBody = body ? JSON.parse(body) : {};
    const prompt = getUserPrompt(requestBody);

    if (prompt === 'TRIGGER_RATE_LIMIT') {
      return sendJson(res, 429, {
        error: {
          message: 'Rate limit exceeded for mock server',
          type: 'rate_limit_error',
          code: 'rate_limit_exceeded',
        },
      });
    }

    if (prompt === 'CHECK_HEADERS') {
      const hasAuth = req.headers.authorization === 'Bearer test-key';
      const hasCustom = req.headers['x-extra-header'] === 'present';
      if (!hasAuth || !hasCustom) {
        return sendJson(res, 400, {
          error: {
            message: 'Missing expected headers',
            type: 'invalid_request_error',
          },
        });
      }

      return sendJson(res, 200, {
        id: 'chatcmpl_mock_headers',
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: requestBody.model ?? 'gpt-4o-mini',
        choices: [
          {
            index: 0,
            finish_reason: 'stop',
            message: {
              role: 'assistant',
              content: 'HEADERS_OK',
            },
          },
        ],
        usage: {
          prompt_tokens: 5,
          completion_tokens: 2,
          total_tokens: 7,
        },
      });
    }

    return sendJson(res, 200, {
      id: 'chatcmpl_mock_basic',
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: requestBody.model ?? 'gpt-4o-mini',
      choices: [
        {
          index: 0,
          finish_reason: 'stop',
          message: {
            role: 'assistant',
            content: `MOCK_RESPONSE:${prompt}`,
          },
        },
      ],
      usage: {
        prompt_tokens: 5,
        completion_tokens: 3,
        total_tokens: 8,
      },
    });
  }

  if (req.method === 'POST' && path === '/v1/embeddings') {
    const body = await readBody(req);
    const requestBody = body ? JSON.parse(body) : {};

    const inputArray = Array.isArray(requestBody.input) ? requestBody.input : [requestBody.input];
    const data = inputArray.map((value, index) => {
      const base = String(value).length;
      return {
        object: 'embedding',
        index,
        embedding: [base, base + 1, base + 2],
      };
    });

    return sendJson(res, 200, {
      object: 'list',
      data,
      model: requestBody.model ?? 'text-embedding-3-small',
      usage: {
        prompt_tokens: inputArray.join(' ').length,
        total_tokens: inputArray.join(' ').length,
      },
    });
  }

  return sendJson(res, 404, { error: 'Not Found', path });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
