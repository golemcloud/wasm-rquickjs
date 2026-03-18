import http from 'node:http';

const PORT = 18080;
const collections = new Map();

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

const toCollectionResponse = (collection) => ({
  name: collection.name,
  fields: collection.fields,
  default_sorting_field: collection.default_sorting_field,
  num_documents: collection.documents.size,
});

const searchCollection = (collection, searchRequest) => {
  const query = String(searchRequest.q ?? '*').toLowerCase();
  const queryBy = String(searchRequest.query_by ?? '').split(',').map((value) => value.trim()).filter(Boolean);
  const fields = queryBy.length > 0 ? queryBy : ['title'];

  const docs = Array.from(collection.documents.values());
  const matched = docs.filter((doc) => {
    if (query === '*' || query.length === 0) {
      return true;
    }

    return fields.some((field) => {
      const value = doc[field];
      return typeof value === 'string' && value.toLowerCase().includes(query);
    });
  });

  return {
    facet_counts: [],
    found: matched.length,
    hits: matched.map((doc, index) => ({
      document: doc,
      text_match: 1000 - index,
      highlights: [],
    })),
    out_of: matched.length,
    page: searchRequest.page ?? 1,
    request_params: {
      collection_name: collection.name,
      q: searchRequest.q,
    },
    search_time_ms: 1,
  };
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const path = url.pathname;

    if (req.method === 'GET' && path === '/health') {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET' && path === '/collections') {
      sendJson(res, 200, Array.from(collections.values()).map(toCollectionResponse));
      return;
    }

    if (req.method === 'POST' && path === '/collections') {
      const body = await readJson(req);
      if (!body.name || !Array.isArray(body.fields)) {
        sendJson(res, 400, { message: 'Missing collection name or fields.' });
        return;
      }

      if (collections.has(body.name)) {
        sendJson(res, 409, { message: `A collection with name \`${body.name}\` already exists.` });
        return;
      }

      collections.set(body.name, {
        name: body.name,
        fields: body.fields,
        default_sorting_field: body.default_sorting_field,
        documents: new Map(),
      });

      sendJson(res, 201, toCollectionResponse(collections.get(body.name)));
      return;
    }

    const collectionMatch = path.match(/^\/collections\/([^/]+)$/);
    if (collectionMatch) {
      const collectionName = decodeURIComponent(collectionMatch[1]);
      const collection = collections.get(collectionName);
      if (!collection) {
        sendJson(res, 404, { message: `Could not find a collection with name \`${collectionName}\`.` });
        return;
      }

      if (req.method === 'GET') {
        sendJson(res, 200, toCollectionResponse(collection));
        return;
      }

      if (req.method === 'DELETE') {
        collections.delete(collectionName);
        sendJson(res, 200, { name: collectionName });
        return;
      }
    }

    const documentsCreateMatch = path.match(/^\/collections\/([^/]+)\/documents$/);
    if (documentsCreateMatch && req.method === 'POST') {
      const collectionName = decodeURIComponent(documentsCreateMatch[1]);
      const collection = collections.get(collectionName);
      if (!collection) {
        sendJson(res, 404, { message: `Could not find a collection with name \`${collectionName}\`.` });
        return;
      }

      const document = await readJson(req);
      if (!document.id) {
        sendJson(res, 400, { message: 'Document id is required.' });
        return;
      }

      collection.documents.set(String(document.id), document);
      sendJson(res, 201, document);
      return;
    }

    const documentByIdMatch = path.match(/^\/collections\/([^/]+)\/documents\/([^/]+)$/);
    if (documentByIdMatch) {
      const collectionName = decodeURIComponent(documentByIdMatch[1]);
      const documentId = decodeURIComponent(documentByIdMatch[2]);

      if (documentId === 'search') {
        // This path is handled by the search endpoint below.
      } else {
      const collection = collections.get(collectionName);
      if (!collection) {
        sendJson(res, 404, { message: `Could not find a collection with name \`${collectionName}\`.` });
        return;
      }

      const doc = collection.documents.get(documentId);
      if (!doc) {
        sendJson(res, 404, { message: `Could not find a document with id \`${documentId}\`.` });
        return;
      }

      if (req.method === 'GET') {
        sendJson(res, 200, doc);
        return;
      }

      if (req.method === 'DELETE') {
        collection.documents.delete(documentId);
        sendJson(res, 200, doc);
        return;
      }
      }
    }

    const searchMatch = path.match(/^\/collections\/([^/]+)\/documents\/search$/);
    if (searchMatch && (req.method === 'POST' || req.method === 'GET')) {
      const collectionName = decodeURIComponent(searchMatch[1]);
      const collection = collections.get(collectionName);
      if (!collection) {
        sendJson(res, 404, { message: `Could not find a collection with name \`${collectionName}\`.` });
        return;
      }

      const searchRequest = req.method === 'GET'
        ? Object.fromEntries(url.searchParams.entries())
        : await readJson(req);
      sendJson(res, 200, searchCollection(collection, searchRequest));
      return;
    }

    if (req.method === 'POST' && path === '/multi_search') {
      const body = await readJson(req);
      const searches = Array.isArray(body.searches) ? body.searches : [];
      const results = searches.map((searchRequest) => {
        const collection = collections.get(searchRequest.collection);
        if (!collection) {
          return {
            code: 404,
            error: `Could not find a collection with name \`${searchRequest.collection}\`.`,
          };
        }
        return searchCollection(collection, searchRequest);
      });
      sendJson(res, 200, { results });
      return;
    }

    sendJson(res, 404, { message: `Unhandled route: ${req.method} ${path}` });
  } catch (error) {
    sendJson(res, 500, { message: error.message || String(error) });
  }
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
