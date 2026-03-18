import http from 'node:http';

const PORT = 18080;

const json = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const parseBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(body));
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
    json(res, 200, { status: 'ok' });
    return;
  }

  if (key === 'GET /v1/tasks/task-success') {
    json(res, 200, {
      id: 'task-success',
      createdAt: '2025-01-01T00:00:00.000Z',
      status: 'SUCCEEDED',
      output: ['https://cdn.example.com/output.mp4'],
    });
    return;
  }

  if (key === 'GET /v1/tasks/task-failed') {
    json(res, 200, {
      id: 'task-failed',
      createdAt: '2025-01-01T00:00:00.000Z',
      status: 'FAILED',
      failure: 'Prompt rejected',
      failureCode: 'CONTENT_POLICY',
    });
    return;
  }

  if (key === 'GET /v1/tasks/task-unauthorized') {
    json(res, 401, { error: 'Unauthorized' });
    return;
  }

  if (key === 'POST /v1/text_to_image') {
    const body = await parseBody(req);
    json(res, 200, {
      id: `task-image-${body?.model || 'unknown'}`,
      echoPromptText: body?.promptText,
      echoRatio: body?.ratio,
    });
    return;
  }

  json(res, 404, { error: 'Not Found', method: req.method, path: url.pathname });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
