import http from 'node:http';

const PORT = 18080;
const TENANT = 'default_tenant';
const DATABASE = 'default_database';

let nextCollectionId = 1;
const collectionsById = new Map();
const collectionNameToId = new Map();

const readJson = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
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

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const makeCollectionResponse = (collection) => ({
  id: collection.id,
  name: collection.name,
  tenant: TENANT,
  database: DATABASE,
  metadata: collection.metadata,
  configuration_json: collection.configuration_json,
  schema: null,
});

const resolveCollection = (collectionIdOrName) => {
  if (collectionsById.has(collectionIdOrName)) {
    return collectionsById.get(collectionIdOrName);
  }
  const mapped = collectionNameToId.get(collectionIdOrName);
  return mapped ? collectionsById.get(mapped) : undefined;
};

const distance = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return Number.POSITIVE_INFINITY;
  }
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const delta = a[i] - b[i];
    sum += delta * delta;
  }
  return Math.sqrt(sum);
};

const listRecords = (collection) => Array.from(collection.records.values());

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (req.method === 'GET' && path === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'GET' && path === '/api/v2/version') {
    sendJson(res, 200, 'mock-1.0.0');
    return;
  }

  if (req.method === 'GET' && path === '/api/v2/heartbeat') {
    sendJson(res, 200, { 'nanosecond heartbeat': 123456789 });
    return;
  }

  if (req.method === 'GET' && path === '/api/v2/pre-flight-checks') {
    sendJson(res, 200, {
      max_batch_size: 1024,
      supports_base64_encoding: true,
    });
    return;
  }

  if (req.method === 'GET' && path === '/api/v2/auth/identity') {
    sendJson(res, 200, {
      user_id: 'mock-user',
      tenant: TENANT,
      databases: [DATABASE],
    });
    return;
  }

  const collectionsBase = `/api/v2/tenants/${TENANT}/databases/${DATABASE}/collections`;

  if (req.method === 'POST' && path === collectionsBase) {
    const body = await readJson(req);
    const existingId = collectionNameToId.get(body.name);
    if (existingId) {
      if (body.get_or_create) {
        sendJson(res, 200, makeCollectionResponse(collectionsById.get(existingId)));
        return;
      }
      sendJson(res, 409, { error: 'Collection already exists' });
      return;
    }

    const id = `mock-col-${nextCollectionId++}`;
    const collection = {
      id,
      name: body.name,
      metadata: body.metadata ?? null,
      configuration_json: body.configuration ?? {},
      records: new Map(),
    };
    collectionsById.set(id, collection);
    collectionNameToId.set(collection.name, id);
    sendJson(res, 200, makeCollectionResponse(collection));
    return;
  }

  if (req.method === 'GET' && path === collectionsBase) {
    sendJson(res, 200, Array.from(collectionsById.values()).map(makeCollectionResponse));
    return;
  }

  if (req.method === 'GET' && path === `/api/v2/tenants/${TENANT}/databases/${DATABASE}/collections_count`) {
    sendJson(res, 200, collectionsById.size);
    return;
  }

  const collectionPathMatch = path.match(
    new RegExp(`^${collectionsBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/([^/]+)$`),
  );

  if (collectionPathMatch) {
    const collection = resolveCollection(collectionPathMatch[1]);
    if (!collection) {
      sendJson(res, 404, { error: 'Collection not found' });
      return;
    }

    if (req.method === 'GET') {
      sendJson(res, 200, makeCollectionResponse(collection));
      return;
    }

    if (req.method === 'DELETE') {
      collectionsById.delete(collection.id);
      collectionNameToId.delete(collection.name);
      sendJson(res, 200, {});
      return;
    }
  }

  const collectionActionMatch = path.match(
    new RegExp(`^${collectionsBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/([^/]+)/(add|count|get|query|delete)$`),
  );

  if (collectionActionMatch) {
    const collection = resolveCollection(collectionActionMatch[1]);
    if (!collection) {
      sendJson(res, 404, { error: 'Collection not found' });
      return;
    }

    const action = collectionActionMatch[2];

    if (action === 'count' && req.method === 'GET') {
      sendJson(res, 200, collection.records.size);
      return;
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    const body = await readJson(req);

    if (action === 'add') {
      const ids = body.ids || [];
      const embeddings = body.embeddings || [];
      const documents = body.documents || [];
      const metadatas = body.metadatas || [];

      for (let i = 0; i < ids.length; i += 1) {
        collection.records.set(ids[i], {
          id: ids[i],
          embedding: embeddings[i],
          document: documents[i],
          metadata: metadatas[i],
        });
      }

      sendJson(res, 200, {});
      return;
    }

    if (action === 'get') {
      const include = body.include || ['documents', 'metadatas'];
      const selected = body.ids
        ? body.ids.map((id) => collection.records.get(id)).filter(Boolean)
        : listRecords(collection);

      sendJson(res, 200, {
        ids: selected.map((record) => record.id),
        documents: include.includes('documents') ? selected.map((record) => record.document) : null,
        metadatas: include.includes('metadatas') ? selected.map((record) => record.metadata) : null,
        embeddings: include.includes('embeddings') ? selected.map((record) => record.embedding) : null,
        uris: [],
        include,
      });
      return;
    }

    if (action === 'query') {
      const include = body.include || ['metadatas', 'documents', 'distances'];
      const queryEmbeddings = body.query_embeddings || [];
      const allRecords = listRecords(collection);

      const ids = [];
      const documents = [];
      const metadatas = [];
      const embeddings = [];
      const distances = [];

      for (const queryEmbedding of queryEmbeddings) {
        const ordered = allRecords
          .map((record) => ({
            record,
            dist: distance(queryEmbedding, record.embedding),
          }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, body.n_results || 10);

        ids.push(ordered.map(({ record }) => record.id));
        documents.push(include.includes('documents') ? ordered.map(({ record }) => record.document) : []);
        metadatas.push(include.includes('metadatas') ? ordered.map(({ record }) => record.metadata) : []);
        embeddings.push(include.includes('embeddings') ? ordered.map(({ record }) => record.embedding) : []);
        distances.push(include.includes('distances') ? ordered.map(({ dist }) => dist) : []);
      }

      sendJson(res, 200, {
        ids,
        documents: include.includes('documents') ? documents : null,
        metadatas: include.includes('metadatas') ? metadatas : null,
        embeddings: include.includes('embeddings') ? embeddings : null,
        distances: include.includes('distances') ? distances : null,
        uris: [],
        include,
      });
      return;
    }

    if (action === 'delete') {
      const ids = body.ids || [];
      let deleted = 0;
      for (const id of ids) {
        if (collection.records.delete(id)) {
          deleted += 1;
        }
      }
      sendJson(res, 200, { deleted });
      return;
    }
  }

  sendJson(res, 404, { error: 'Not Found', path });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
