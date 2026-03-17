import http from 'node:http';

const PORT = 18080;
const AUTH_TOKEN = 'test-token';

const namespaces = new Map();
namespaces.set('default', []);

const getNamespace = (name = 'default') => {
  if (!namespaces.has(name)) {
    namespaces.set(name, []);
  }
  return namespaces.get(name);
};

const readBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (chunks.length === 0) {
    return null;
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

const send = (res, statusCode, payload) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const parseEndpoint = (path) => {
  const parts = path.split('/').filter(Boolean);
  const [command, namespace] = parts;
  return { command, namespace: namespace || 'default' };
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, { status: 'ok' });
  }

  if (req.method !== 'POST') {
    return send(res, 405, { error: 'Method Not Allowed' });
  }

  if (req.headers.authorization !== `Bearer ${AUTH_TOKEN}`) {
    return send(res, 401, { error: 'Unauthorized' });
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const { command, namespace } = parseEndpoint(url.pathname);
  const body = await readBody(req);

  if (command === 'upsert') {
    const records = Array.isArray(body) ? body : [body];
    const ns = getNamespace(namespace);
    for (const record of records) {
      const existingIdx = ns.findIndex((item) => item.id === record.id);
      if (existingIdx >= 0) {
        ns[existingIdx] = { ...ns[existingIdx], ...record };
      } else {
        ns.push(record);
      }
    }
    return send(res, 200, { result: 'Success' });
  }

  if (command === 'query') {
    const ns = getNamespace(namespace);
    const topK = body?.topK ?? 3;
    const matches = ns.slice(0, topK).map((record, index) => ({
      id: record.id,
      score: 1 - index * 0.01,
      metadata: record.metadata ?? null,
      vector: record.vector,
      data: record.data,
    }));

    if (Array.isArray(body)) {
      return send(res, 200, { result: body.map(() => matches) });
    }

    return send(res, 200, { result: matches });
  }

  if (command === 'info') {
    let total = 0;
    const nsCount = {};
    for (const [name, records] of namespaces.entries()) {
      total += records.length;
      nsCount[name] = records.length;
    }

    return send(res, 200, {
      result: {
        vectorCount: total,
        pendingVectorCount: 0,
        diskSize: 0,
        dimension: 3,
        similarityFunction: 'cosine',
        namespaces: nsCount,
      },
    });
  }

  if (command === 'list-namespaces') {
    return send(res, 200, { result: Array.from(namespaces.keys()) });
  }

  if (command === 'delete-namespace') {
    namespaces.delete(namespace);
    return send(res, 200, { result: 'Success' });
  }

  return send(res, 404, { error: `Unknown endpoint: ${url.pathname}` });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
