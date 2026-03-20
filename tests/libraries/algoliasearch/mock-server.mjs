import http from 'node:http';

const PORT = 18080;

let nextTaskId = 1000;
const taskPolls = new Map();
const objects = new Map();

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });

const ensureAuth = (url, req) => {
  const appId = url.searchParams.get('x-algolia-application-id') ?? req.headers['x-algolia-application-id'];
  const apiKey = url.searchParams.get('x-algolia-api-key') ?? req.headers['x-algolia-api-key'];
  return appId === 'test-app' && apiKey === 'test-key';
};

const searchResponse = (query) => ({
  hits: [
    { objectID: 'phone-1', name: `Phone ${query || 'Default'}` },
    { objectID: 'phone-2', name: 'Phone Pro' },
  ],
  nbHits: 2,
  page: 0,
  nbPages: 1,
  hitsPerPage: 20,
  processingTimeMS: 1,
  exhaustiveNbHits: true,
  query: query || '',
  params: '',
});

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
  const path = reqUrl.pathname;

  if (req.method === 'GET' && path === '/health') {
    return sendJson(res, 200, { status: 'ok' });
  }

  if (!ensureAuth(reqUrl, req)) {
    return sendJson(res, 401, { message: 'Invalid test credentials' });
  }

  if (req.method === 'POST' && path === '/1/indexes/products/query') {
    const body = await readBody(req);
    const payload = body ? JSON.parse(body) : {};
    return sendJson(res, 200, searchResponse(payload.query));
  }

  if (req.method === 'POST' && path === '/1/indexes/*/queries') {
    const body = await readBody(req);
    const payload = body ? JSON.parse(body) : { requests: [] };
    const results = (payload.requests || []).map((request) => searchResponse(request.query));
    return sendJson(res, 200, { results });
  }

  if (req.method === 'POST' && path === '/1/indexes/products') {
    const body = await readBody(req);
    const payload = body ? JSON.parse(body) : {};
    const objectID = payload.objectID || `generated-${Date.now()}`;
    const taskID = nextTaskId++;
    objects.set(objectID, { objectID, ...payload });
    taskPolls.set(taskID, 0);
    return sendJson(res, 200, {
      taskID,
      objectID,
      createdAt: '2026-03-18T00:00:00.000Z',
    });
  }

  if (req.method === 'GET' && path.startsWith('/1/indexes/products/task/')) {
    const taskID = Number(path.split('/').at(-1));
    const current = taskPolls.get(taskID);
    if (current === undefined) {
      return sendJson(res, 404, { message: 'Task not found' });
    }

    const next = current + 1;
    taskPolls.set(taskID, next);
    return sendJson(res, 200, { status: next >= 2 ? 'published' : 'notPublished' });
  }

  if (req.method === 'GET' && path.startsWith('/1/indexes/products/')) {
    const objectID = decodeURIComponent(path.split('/').at(-1));
    if (objectID === 'missing-object') {
      return sendJson(res, 404, { message: 'Object not found' });
    }

    const found = objects.get(objectID);
    if (!found) {
      return sendJson(res, 404, { message: 'Object not found' });
    }

    return sendJson(res, 200, found);
  }

  return sendJson(res, 404, { message: 'Not Found', path });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
