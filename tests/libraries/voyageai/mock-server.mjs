import http from 'node:http';

const PORT = 18080;
let retryEmbeddingsCount = 0;

const readJson = (req) => new Promise((resolve, reject) => {
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

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const server = http.createServer(async (req, res) => {
  const path = req.url.split('?')[0];

  if (req.method === 'GET' && path === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'POST' && path === '/v1/embeddings') {
    const body = await readJson(req);
    const firstInput = Array.isArray(body.input) ? body.input[0] : body.input;

    if (firstInput === 'retry-me') {
      retryEmbeddingsCount += 1;
      if (retryEmbeddingsCount === 1) {
        sendJson(res, 429, { detail: 'rate limited once' });
        return;
      }
    }

    sendJson(res, 200, {
      object: 'list',
      data: [{ object: 'embedding', embedding: [0.5, 0.25, 0.125], index: 0 }],
      model: body.model || 'voyage-3-large',
      usage: { total_tokens: 6 },
    });
    return;
  }

  if (req.method === 'POST' && path === '/v1/rerank') {
    const body = await readJson(req);
    const docs = body.documents || [];

    sendJson(res, 200, {
      object: 'list',
      data: [
        { index: 2, relevance_score: 0.99, document: docs[2] },
        { index: 0, relevance_score: 0.42, document: docs[0] },
      ],
      model: body.model || 'rerank-2',
      usage: { total_tokens: 11 },
    });
    return;
  }

  sendJson(res, 404, { error: 'Not Found', path: req.url });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
