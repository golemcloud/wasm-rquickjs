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

const getPromptText = (requestBody) => {
  const messages = Array.isArray(requestBody?.messages) ? requestBody.messages : [];
  for (const message of messages) {
    const content = message?.content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      const textPart = content.find((part) => part?.type === 'text' && typeof part?.text === 'string');
      if (textPart) return textPart.text;
    }
  }
  return '';
};

const server = http.createServer(async (req, res) => {
  const path = req.url?.split('?')[0] ?? '/';

  if (req.method === 'GET' && path === '/health') {
    return sendJson(res, 200, { status: 'ok' });
  }

  if (req.method === 'POST' && path === '/v1/messages') {
    const body = await readBody(req);
    const requestBody = body ? JSON.parse(body) : {};
    const prompt = getPromptText(requestBody);

    if (prompt === 'TRIGGER_ANTHROPIC_ERROR') {
      return sendJson(res, 401, {
        type: 'error',
        error: {
          type: 'authentication_error',
          message: 'invalid x-api-key',
        },
      });
    }

    if (prompt === 'CHECK_HEADERS') {
      const hasApiKey = req.headers['x-api-key'] === 'test-key';
      const hasVersion = req.headers['anthropic-version'] === '2023-06-01';
      const hasCustom = req.headers['x-extra-header'] === 'present';

      if (!hasApiKey || !hasVersion || !hasCustom) {
        return sendJson(res, 400, {
          type: 'error',
          error: {
            type: 'invalid_request_error',
            message: 'missing required anthropic headers',
          },
        });
      }

      return sendJson(res, 200, {
        id: 'msg_mock_headers',
        type: 'message',
        role: 'assistant',
        model: requestBody?.model ?? 'claude-3-haiku-20240307',
        content: [{ type: 'text', text: 'HEADERS_OK' }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 2,
          output_tokens: 1,
        },
      });
    }

    return sendJson(res, 200, {
      id: 'msg_mock_basic',
      type: 'message',
      role: 'assistant',
      model: requestBody?.model ?? 'claude-3-haiku-20240307',
      content: [{ type: 'text', text: `MOCK_OK:${prompt}` }],
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: {
        input_tokens: 4,
        output_tokens: 1,
      },
    });
  }

  return sendJson(res, 404, { error: 'Not Found', path });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
