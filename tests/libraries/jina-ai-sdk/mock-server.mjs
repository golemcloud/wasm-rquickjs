import http from 'node:http';

const PORT = 18080;

const routes = {
  'GET /health': (_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  },
  'POST /v1/embeddings': (req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        model: 'jina-embeddings-v4',
        object: 'list',
        data: [{ index: 0, embedding: [0.1, 0.2, 0.3] }],
        received: body ? JSON.parse(body) : {},
      }));
    });
  },
  'POST /v1/rerank': (req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        model: 'jina-reranker-v2-base-multilingual',
        results: [{ index: 0, relevance_score: 0.99 }],
        received: body ? JSON.parse(body) : {},
      }));
    });
  },
};

const server = http.createServer((req, res) => {
  const key = `${req.method} ${req.url.split('?')[0]}`;
  const handler = routes[key];
  if (handler) {
    handler(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found', path: req.url }));
  }
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
