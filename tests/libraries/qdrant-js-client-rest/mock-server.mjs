import http from 'node:http';

const PORT = 18080;

const collections = new Map([
  [
    'mock_vectors',
    {
      vectors: { size: 3, distance: 'Cosine' },
      points: [
        { id: 10, vector: [1, 0, 0], payload: { label: 'seed' } },
      ],
    },
  ],
]);

const send = (res, status, payload) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const ok = (res, result) => send(res, 200, { result, status: 'ok', time: 0.001 });
const created = (res, result) => send(res, 201, { result, status: 'ok', time: 0.001 });

const readBody = async (req) => {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }

  if (!body) {
    return {};
  }

  return JSON.parse(body);
};

const cosine = (a, b) => {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const notFound = (res, path) => send(res, 404, { status: 'error', result: null, error: `No route for ${path}` });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (req.method === 'GET' && path === '/health') {
    return send(res, 200, { status: 'ok' });
  }

  if (req.method === 'GET' && (path === '/' || path === '/prefixed/')) {
    return send(res, 200, {
      title: 'qdrant',
      version: '1.14.0-mock',
      commit: 'mock-commit-sha',
    });
  }

  if (req.method === 'GET' && path === '/collections') {
    return ok(res, {
      collections: Array.from(collections.keys()).map((name) => ({ name })),
    });
  }

  const existsMatch = path.match(/^\/collections\/([^/]+)\/exists$/);
  if (req.method === 'GET' && existsMatch) {
    const name = decodeURIComponent(existsMatch[1]);
    return ok(res, { exists: collections.has(name) });
  }

  const collectionMatch = path.match(/^\/collections\/([^/]+)$/);
  if (collectionMatch) {
    const name = decodeURIComponent(collectionMatch[1]);

    if (req.method === 'PUT') {
      const body = await readBody(req);
      collections.set(name, {
        vectors: body.vectors ?? { size: 3, distance: 'Cosine' },
        points: [],
      });
      return created(res, { status: 'acknowledged', operation_id: Date.now() % 100000 });
    }

    if (req.method === 'GET') {
      const collection = collections.get(name);
      if (!collection) {
        return send(res, 404, { status: 'error', result: null, error: 'Collection not found' });
      }
      return ok(res, {
        status: 'green',
        vectors_count: collection.points.length,
        points_count: collection.points.length,
        config: {
          params: {
            vectors: collection.vectors,
          },
        },
      });
    }

    if (req.method === 'DELETE') {
      collections.delete(name);
      return ok(res, { status: 'acknowledged', operation_id: Date.now() % 100000 });
    }
  }

  const upsertMatch = path.match(/^\/collections\/([^/]+)\/points$/);
  if (req.method === 'PUT' && upsertMatch) {
    const name = decodeURIComponent(upsertMatch[1]);
    const collection = collections.get(name);
    if (!collection) {
      return send(res, 404, { status: 'error', result: null, error: 'Collection not found' });
    }

    const body = await readBody(req);
    const incoming = Array.isArray(body.points) ? body.points : [];

    for (const point of incoming) {
      const existingIndex = collection.points.findIndex((candidate) => candidate.id === point.id);
      if (existingIndex >= 0) {
        collection.points[existingIndex] = point;
      } else {
        collection.points.push(point);
      }
    }

    return ok(res, {
      status: 'acknowledged',
      operation_id: Date.now() % 100000,
    });
  }

  const countMatch = path.match(/^\/collections\/([^/]+)\/points\/count$/);
  if (req.method === 'POST' && countMatch) {
    const name = decodeURIComponent(countMatch[1]);
    const collection = collections.get(name);
    if (!collection) {
      return send(res, 404, { status: 'error', result: null, error: 'Collection not found' });
    }

    return ok(res, {
      count: collection.points.length,
    });
  }

  const queryMatch = path.match(/^\/collections\/([^/]+)\/points\/query$/);
  if (req.method === 'POST' && queryMatch) {
    const name = decodeURIComponent(queryMatch[1]);
    const collection = collections.get(name);
    if (!collection) {
      return send(res, 404, { status: 'error', result: null, error: 'Collection not found' });
    }

    const body = await readBody(req);
    const query = Array.isArray(body.query) ? body.query : [];
    const limit = Number.isFinite(body.limit) ? body.limit : 10;

    const points = collection.points
      .map((point) => ({
        id: point.id,
        version: 1,
        score: cosine(point.vector, query),
        payload: point.payload ?? {},
        vector: point.vector,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return ok(res, { points });
  }

  return notFound(res, path);
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
