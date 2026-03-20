import http from 'node:http';

const PORT = 18080;

const indexes = new Map();
let nextTaskUid = 1;
const tasks = new Map();

const nowIso = () => new Date().toISOString();

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

const sendApiError = (res, status, message, code) => {
  sendJson(res, status, {
    message,
    code,
    type: 'invalid_request',
    link: `https://docs.meilisearch.com/errors#${code}`,
  });
};

const enqueueTask = ({ indexUid, type, details }) => {
  const task = {
    uid: nextTaskUid,
    taskUid: nextTaskUid,
    indexUid,
    status: 'enqueued',
    type,
    enqueuedAt: nowIso(),
    details,
  };

  tasks.set(task.uid, { task, polls: 0 });
  nextTaskUid += 1;

  return {
    taskUid: task.uid,
    indexUid: task.indexUid,
    status: 'enqueued',
    type: task.type,
    enqueuedAt: task.enqueuedAt,
  };
};

const getTaskPayload = (taskState) => {
  taskState.polls += 1;

  if (taskState.polls === 1) {
    return {
      ...taskState.task,
      status: 'processing',
      startedAt: nowIso(),
    };
  }

  return {
    ...taskState.task,
    status: 'succeeded',
    startedAt: nowIso(),
    finishedAt: nowIso(),
    duration: 'PT0.001S',
  };
};

const searchDocuments = (documents, query) => {
  const normalized = String(query || '').toLowerCase().trim();
  if (!normalized) {
    return documents;
  }

  return documents.filter((doc) => {
    return Object.values(doc).some((value) => {
      return typeof value === 'string' && value.toLowerCase().includes(normalized);
    });
  });
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const path = url.pathname;

    if (req.method === 'GET' && path === '/health') {
      sendJson(res, 200, { status: 'available' });
      return;
    }

    if (req.method === 'GET' && path === '/version') {
      sendJson(res, 200, {
        commitSha: 'mock-sha',
        commitDate: '2026-01-01',
        pkgVersion: '1.0.0-mock',
      });
      return;
    }

    if (req.method === 'POST' && path === '/indexes') {
      const body = await readJson(req);
      const uid = body.uid;
      if (!uid) {
        sendApiError(res, 400, 'Missing `uid`.', 'missing_index_uid');
        return;
      }
      if (indexes.has(uid)) {
        sendApiError(res, 409, `Index \`${uid}\` already exists.`, 'index_already_exists');
        return;
      }

      indexes.set(uid, {
        uid,
        primaryKey: body.primaryKey || null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        documents: [],
      });

      sendJson(
        res,
        202,
        enqueueTask({
          indexUid: uid,
          type: 'indexCreation',
          details: { primaryKey: body.primaryKey || null },
        }),
      );
      return;
    }

    const indexMatch = path.match(/^\/indexes\/([^/]+)$/);
    if (indexMatch) {
      const uid = decodeURIComponent(indexMatch[1]);
      const indexData = indexes.get(uid);

      if (!indexData) {
        sendApiError(res, 404, `Index \`${uid}\` not found.`, 'index_not_found');
        return;
      }

      if (req.method === 'GET') {
        sendJson(res, 200, {
          uid: indexData.uid,
          primaryKey: indexData.primaryKey,
          createdAt: indexData.createdAt,
          updatedAt: indexData.updatedAt,
        });
        return;
      }

      if (req.method === 'DELETE') {
        indexes.delete(uid);
        sendJson(
          res,
          202,
          enqueueTask({
            indexUid: uid,
            type: 'indexDeletion',
          }),
        );
        return;
      }
    }

    const addDocsMatch = path.match(/^\/indexes\/([^/]+)\/documents$/);
    if (addDocsMatch && req.method === 'POST') {
      const uid = decodeURIComponent(addDocsMatch[1]);
      const indexData = indexes.get(uid);
      if (!indexData) {
        sendApiError(res, 404, `Index \`${uid}\` not found.`, 'index_not_found');
        return;
      }

      const docs = await readJson(req);
      const normalizedDocs = Array.isArray(docs) ? docs : [docs];
      for (const doc of normalizedDocs) {
        indexData.documents.push(doc);
      }
      indexData.updatedAt = nowIso();

      sendJson(
        res,
        202,
        enqueueTask({
          indexUid: uid,
          type: 'documentAdditionOrUpdate',
          details: { receivedDocuments: normalizedDocs.length },
        }),
      );
      return;
    }

    const searchMatch = path.match(/^\/indexes\/([^/]+)\/search$/);
    if (searchMatch && req.method === 'POST') {
      const uid = decodeURIComponent(searchMatch[1]);
      const indexData = indexes.get(uid);
      if (!indexData) {
        sendApiError(res, 404, `Index \`${uid}\` not found.`, 'index_not_found');
        return;
      }

      const body = await readJson(req);
      const hits = searchDocuments(indexData.documents, body.q);
      sendJson(res, 200, {
        hits,
        offset: 0,
        limit: body.limit || 20,
        estimatedTotalHits: hits.length,
        processingTimeMs: 1,
        query: body.q || '',
      });
      return;
    }

    const taskMatch = path.match(/^\/tasks\/([0-9]+)$/);
    if (taskMatch && req.method === 'GET') {
      const uid = Number(taskMatch[1]);
      const taskState = tasks.get(uid);
      if (!taskState) {
        sendApiError(res, 404, `Task \`${uid}\` not found.`, 'task_not_found');
        return;
      }

      sendJson(res, 200, getTaskPayload(taskState));
      return;
    }

    sendApiError(res, 404, `Unhandled route: ${req.method} ${path}`, 'route_not_found');
  } catch (error) {
    sendApiError(res, 500, error.message || String(error), 'internal_error');
  }
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
