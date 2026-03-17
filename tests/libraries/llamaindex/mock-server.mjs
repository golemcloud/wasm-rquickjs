import http from 'node:http';

const PORT = 18080;
let retryCalls = 0;

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  const path = (req.url || '').split('?')[0];

  if (req.method === 'GET' && path === '/health') {
    json(res, 200, { status: 'ok' });
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', () => {
    if (req.method === 'POST' && path === '/v1/embeddings') {
      json(res, 200, {
        object: 'list',
        data: [{ object: 'embedding', index: 0, embedding: [0.1, 0.2, 0.3, 0.4] }],
        model: 'text-embedding-3-small',
        usage: { prompt_tokens: 3, total_tokens: 3 },
      });
      return;
    }

    if (req.method === 'POST' && path === '/v1/chat/completions') {
      let payload;
      try {
        payload = JSON.parse(body || '{}');
      } catch {
        json(res, 400, { error: { message: 'Invalid JSON body' } });
        return;
      }

      const promptText = JSON.stringify(payload.messages || []);

      if (promptText.includes('TRIGGER_RETRY_FLOW')) {
        if (retryCalls === 0) {
          retryCalls += 1;
          json(res, 429, { error: { message: 'rate limit from mock server' } });
          return;
        }
        json(res, 200, {
          id: 'chatcmpl-recovered',
          object: 'chat.completion',
          created: 1,
          model: 'gpt-4o-mini',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: 'RECOVERED' },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 8, completion_tokens: 1, total_tokens: 9 },
        });
        return;
      }

      if (promptText.includes('project Orion access phrase')) {
        json(res, 200, {
          id: 'chatcmpl-rag',
          object: 'chat.completion',
          created: 1,
          model: 'gpt-4o-mini',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: 'ALPHA-123' },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 24, completion_tokens: 2, total_tokens: 26 },
        });
        return;
      }

      if (promptText.includes('Return the word MOCK_OK')) {
        json(res, 200, {
          id: 'chatcmpl-basic',
          object: 'chat.completion',
          created: 1,
          model: 'gpt-4o-mini',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: 'MOCK_OK' },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 7, completion_tokens: 1, total_tokens: 8 },
        });
        return;
      }

      json(res, 500, { error: { message: 'mock internal failure' } });
      return;
    }

    json(res, 404, { error: 'Not Found', path });
  });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
