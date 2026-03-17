import http from 'node:http';

const PORT = 18080;

const readJsonBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
};

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const server = http.createServer(async (req, res) => {
  const path = req.url?.split('?')[0] ?? '';

  if (req.method === 'GET' && path === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  const body = await readJsonBody(req);

  if (path === '/v2/vectordb/collections/list') {
    const auth = req.headers.authorization ?? '';
    sendJson(res, 200, {
      code: 0,
      data: ['books', 'docs'],
      receivedDbName: body.dbName,
      authHeaderPresent: auth.startsWith('Bearer '),
    });
    return;
  }

  if (path === '/v2/vectordb/entities/search') {
    sendJson(res, 200, {
      code: 0,
      topks: [2, 1],
      data: [
        { id: 1, score: 0.01 },
        { id: 2, score: 0.02 },
        { id: 3, score: 0.03 },
      ],
      receivedDbName: body.dbName,
      echoedCollection: body.collectionName,
    });
    return;
  }

  if (path === '/v2/vectordb/collections/describe') {
    if (body.collectionName === 'missing') {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('collection does not exist');
      return;
    }

    sendJson(res, 200, {
      code: 0,
      data: {
        collectionName: body.collectionName,
      },
    });
    return;
  }

  sendJson(res, 404, { error: 'Not Found', path });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
