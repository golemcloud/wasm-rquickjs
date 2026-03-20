import http from 'node:http';

const PORT = 18080;
const vectorsByNamespace = new Map();

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

const indexModel = {
  name: 'mock-index',
  dimension: 3,
  metric: 'cosine',
  host: 'localhost:18080',
  spec: {
    serverless: {
      cloud: 'aws',
      region: 'us-east-1',
    },
  },
  status: {
    ready: true,
    state: 'Ready',
  },
  vector_type: 'dense',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (req.method === 'GET' && path === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'GET' && path === '/indexes') {
    sendJson(res, 200, { indexes: [indexModel] });
    return;
  }

  if (req.method === 'GET' && path === '/indexes/mock-index') {
    sendJson(res, 200, indexModel);
    return;
  }

  if (req.method === 'POST' && path === '/vectors/upsert') {
    const body = await readJson(req);
    const namespace = body.namespace || '__default__';
    const records = vectorsByNamespace.get(namespace) || new Map();
    for (const vector of body.vectors || []) {
      records.set(vector.id, vector);
    }
    vectorsByNamespace.set(namespace, records);
    sendJson(res, 200, { upsertedCount: (body.vectors || []).length });
    return;
  }

  if (req.method === 'POST' && path === '/query') {
    const body = await readJson(req);
    const namespace = body.namespace || '__default__';
    const records = vectorsByNamespace.get(namespace) || new Map();
    const matches = Array.from(records.values()).map((record, idx) => ({
      id: record.id,
      score: idx === 0 ? 0.99 : 0.75,
      values: record.values,
      metadata: record.metadata,
    }));

    sendJson(res, 200, {
      matches: matches.slice(0, body.topK || 10),
      namespace,
      usage: { read_units: 1 },
    });
    return;
  }

  if (req.method === 'GET' && path === '/vectors/fetch') {
    const namespace = url.searchParams.get('namespace') || '__default__';
    const records = vectorsByNamespace.get(namespace) || new Map();
    const ids = url.searchParams.getAll('ids');
    const vectors = {};
    for (const id of ids) {
      const record = records.get(id);
      if (record) {
        vectors[id] = {
          id: record.id,
          values: record.values,
          metadata: record.metadata,
        };
      }
    }

    sendJson(res, 200, {
      namespace,
      vectors,
      usage: { read_units: 1 },
    });
    return;
  }

  if (req.method === 'POST' && path === '/embed') {
    const body = await readJson(req);
    sendJson(res, 200, {
      model: body.model,
      vector_type: 'dense',
      data: [{ vector_type: 'dense', values: [0.11, 0.22, 0.33] }],
      usage: { total_tokens: 3 },
    });
    return;
  }

  if (req.method === 'POST' && path === '/rerank') {
    const body = await readJson(req);
    const docs = body.documents || [];
    sendJson(res, 200, {
      model: body.model,
      data: [
        {
          index: 1,
          score: 0.98,
          document: { text: docs[1] || '' },
        },
      ],
      usage: { rerank_units: 1 },
    });
    return;
  }

  sendJson(res, 404, { error: 'Not Found', path });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
