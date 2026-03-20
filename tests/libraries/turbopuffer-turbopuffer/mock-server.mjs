import http from 'node:http';

const PORT = 18080;

const readJson = (req) =>
  new Promise((resolve, reject) => {
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

const queryBilling = {
  billable_logical_bytes_queried: 100,
  billable_logical_bytes_returned: 50,
};

const queryPerformance = {
  approx_namespace_size: 2,
  cache_hit_ratio: 1,
  cache_temperature: 'hot',
  exhaustive_search_count: 0,
  query_execution_ms: 2,
  server_total_ms: 3,
};

const namespaces = ['vec-alpha', 'vec-beta'];
const schemas = new Map();
const rowsByNamespace = new Map();

const getRows = (namespace) => {
  if (!rowsByNamespace.has(namespace)) {
    rowsByNamespace.set(namespace, []);
  }
  return rowsByNamespace.get(namespace);
};

const toResponseRow = (row) => {
  const result = { id: row.id, $dist: 0.01 };
  if (row.vector !== undefined) {
    result.vector = row.vector;
  }

  for (const [key, value] of Object.entries(row)) {
    if (key !== 'id' && key !== 'vector') {
      result[key] = value;
    }
  }

  return result;
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (req.method === 'GET' && path === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'GET' && path === '/v1/namespaces') {
    const cursor = url.searchParams.get('cursor');
    const page = cursor === 'page-2' ? [namespaces[1]] : [namespaces[0]];
    sendJson(res, 200, {
      namespaces: page.map((id) => ({ id })),
      next_cursor: cursor === 'page-2' ? '' : 'page-2',
    });
    return;
  }

  const schemaMatch = path.match(/^\/v1\/namespaces\/([^/]+)\/schema$/);
  if (schemaMatch) {
    const namespace = decodeURIComponent(schemaMatch[1]);

    if (req.method === 'GET') {
      const schema = schemas.get(namespace);
      if (!schema) {
        sendJson(res, 404, { error: 'namespace not found' });
        return;
      }

      sendJson(res, 200, schema);
      return;
    }

    if (req.method === 'POST') {
      const schema = await readJson(req);
      schemas.set(namespace, schema);
      sendJson(res, 200, schema);
      return;
    }
  }

  const metadataMatch = path.match(/^\/v1\/namespaces\/([^/]+)\/metadata$/);
  if (metadataMatch && req.method === 'GET') {
    const namespace = decodeURIComponent(metadataMatch[1]);
    const schema = schemas.get(namespace) || {};
    sendJson(res, 200, {
      approx_logical_bytes: 128,
      approx_row_count: getRows(namespace).length,
      created_at: '2026-03-17T00:00:00Z',
      encryption: { sse: true },
      index: { status: 'up_to_date' },
      schema,
      updated_at: '2026-03-17T00:00:01Z',
    });
    return;
  }

  const warmMatch = path.match(/^\/v1\/namespaces\/([^/]+)\/hint_cache_warm$/);
  if (warmMatch && req.method === 'GET') {
    sendJson(res, 200, {
      status: 'ACCEPTED',
      message: 'cache warm requested',
    });
    return;
  }

  const writeMatch = path.match(/^\/v2\/namespaces\/([^/]+)$/);
  if (writeMatch && req.method === 'POST') {
    const namespace = decodeURIComponent(writeMatch[1]);
    const body = await readJson(req);
    const rows = getRows(namespace);
    for (const row of body.upsert_rows || []) {
      const idx = rows.findIndex((existing) => existing.id === row.id);
      if (idx === -1) {
        rows.push(row);
      } else {
        rows[idx] = row;
      }
    }

    sendJson(res, 200, {
      billing: {
        billable_logical_bytes_written: 42,
        query: queryBilling,
      },
      message: 'upsert complete',
      rows_affected: (body.upsert_rows || []).length,
      rows_upserted: (body.upsert_rows || []).length,
      upserted_ids: (body.upsert_rows || []).map((row) => row.id),
      status: 'OK',
    });
    return;
  }

  const queryMatch = path.match(/^\/v2\/namespaces\/([^/]+)\/query$/);
  if (queryMatch && req.method === 'POST') {
    const namespace = decodeURIComponent(queryMatch[1]);
    const rows = getRows(namespace).map(toResponseRow);
    const body = await readJson(req);
    const topK = body.top_k || 10;

    if (url.searchParams.get('stainless_overload') === 'multiQuery') {
      const queries = body.queries || [];
      sendJson(res, 200, {
        billing: queryBilling,
        performance: queryPerformance,
        results: queries.map((query) => ({
          rows: rows.slice(0, query.top_k || topK),
        })),
      });
      return;
    }

    sendJson(res, 200, {
      billing: queryBilling,
      performance: {
        ...queryPerformance,
        client_total_ms: 1,
      },
      rows: rows.slice(0, topK),
    });
    return;
  }

  const explainMatch = path.match(/^\/v2\/namespaces\/([^/]+)\/explain_query$/);
  if (explainMatch && req.method === 'POST') {
    sendJson(res, 200, {
      plan_text: 'Mock query plan: scan -> rank -> top_k',
    });
    return;
  }

  const deleteMatch = path.match(/^\/v2\/namespaces\/([^/]+)$/);
  if (deleteMatch && req.method === 'DELETE') {
    const namespace = decodeURIComponent(deleteMatch[1]);
    rowsByNamespace.delete(namespace);
    schemas.delete(namespace);
    sendJson(res, 200, {
      status: 'OK',
    });
    return;
  }

  sendJson(res, 404, { error: 'Not Found', path });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
