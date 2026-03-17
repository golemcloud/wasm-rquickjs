import http from 'node:http';

const PORT = 18080;
let retryAttempts = 0;

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const toolCompletion = ({ id, model, toolName, args, usage }) => ({
  id,
  object: 'chat.completion',
  created: Math.floor(Date.now() / 1000),
  model,
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_mock_1',
            type: 'function',
            function: {
              name: toolName,
              arguments: JSON.stringify(args),
            },
          },
        ],
      },
      finish_reason: 'tool_calls',
    },
  ],
  usage: usage ?? {
    prompt_tokens: 11,
    completion_tokens: 7,
    total_tokens: 18,
  },
});

const passthroughCompletion = ({ id, model, content }) => ({
  id,
  object: 'chat.completion',
  created: Math.floor(Date.now() / 1000),
  model,
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content,
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 5,
    completion_tokens: 4,
    total_tokens: 9,
  },
});

const parseBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
};

const pickScenario = (body) => {
  const text = body?.messages?.map((msg) => (typeof msg.content === 'string' ? msg.content : '')).join(' ');
  if (text.includes('INTEGRATION_RETRY')) return 'retry';
  if (text.includes('INTEGRATION_PASSTHROUGH')) return 'passthrough';
  return 'structured';
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    json(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'POST' && req.url === '/v1/chat/completions') {
    let body;
    try {
      body = await parseBody(req);
    } catch {
      json(res, 400, { error: { message: 'invalid-json' } });
      return;
    }

    const scenario = pickScenario(body);
    const model = body?.model || 'gpt-4o-mini';

    if (scenario === 'passthrough') {
      json(res, 200, passthroughCompletion({
        id: 'chatcmpl-pass-1',
        model,
        content: 'PASSTHROUGH_OK',
      }));
      return;
    }

    const toolName = body?.tools?.[0]?.function?.name || 'ExtractModel';

    if (scenario === 'retry') {
      retryAttempts += 1;
      if (retryAttempts === 1) {
        json(res, 200, toolCompletion({
          id: 'chatcmpl-retry-1',
          model,
          toolName,
          args: { name: 'Ada Lovelace', age: 'thirty-six' },
        }));
        return;
      }

      json(res, 200, toolCompletion({
        id: 'chatcmpl-retry-2',
        model,
        toolName,
        args: { name: 'Ada Lovelace', age: 36 },
      }));
      return;
    }

    json(res, 200, toolCompletion({
      id: 'chatcmpl-structured-1',
      model,
      toolName,
      args: { name: 'Grace Hopper', age: 85 },
    }));
    return;
  }

  json(res, 404, { error: 'Not Found', path: req.url });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
