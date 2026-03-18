import http from "node:http";

const PORT = 18080;
const indexes = new Map();

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "x-elastic-product": "Elasticsearch",
  });
  res.end(JSON.stringify(body));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function extractPathParts(pathname) {
  return pathname.split("/").filter(Boolean);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (req.method === "GET" && pathname === "/health") {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  if (req.method === "HEAD" && pathname === "/") {
    res.writeHead(200, { "x-elastic-product": "Elasticsearch" });
    res.end();
    return;
  }

  if (req.method === "GET" && pathname === "/") {
    sendJson(res, 200, {
      name: "elastic-mock-node",
      cluster_name: "elastic-mock-cluster",
      cluster_uuid: "mock-cluster",
      version: {
        number: "9.4.0",
        build_flavor: "default",
        build_type: "mock",
        build_hash: "mock-hash",
        build_date: "2026-01-01T00:00:00.000Z",
        build_snapshot: false,
        lucene_version: "9.12.0",
        minimum_wire_compatibility_version: "8.0.0",
        minimum_index_compatibility_version: "8.0.0",
      },
      tagline: "You Know, for Search",
    });
    return;
  }

  const parts = extractPathParts(pathname);

  if (req.method === "PUT" && parts.length === 1) {
    const index = parts[0];
    if (!indexes.has(index)) {
      indexes.set(index, new Map());
    }
    sendJson(res, 200, { acknowledged: true, index });
    return;
  }

  if (req.method === "DELETE" && parts.length === 1) {
    const index = parts[0];
    indexes.delete(index);
    sendJson(res, 200, { acknowledged: true, index });
    return;
  }

  if (req.method === "PUT" && parts.length === 3 && parts[1] === "_doc") {
    const [index, , id] = parts;
    const document = await readJsonBody(req);
    if (!indexes.has(index)) {
      indexes.set(index, new Map());
    }
    const docs = indexes.get(index);
    const exists = docs.has(id);
    docs.set(id, document);
    sendJson(res, 201, {
      _index: index,
      _id: id,
      _version: exists ? 2 : 1,
      result: exists ? "updated" : "created",
      _shards: { total: 1, successful: 1, failed: 0 },
      _seq_no: 1,
      _primary_term: 1,
    });
    return;
  }

  if (req.method === "GET" && parts.length === 3 && parts[1] === "_doc") {
    const [index, , id] = parts;
    const docs = indexes.get(index);
    if (!docs || !docs.has(id)) {
      sendJson(res, 404, {
        error: {
          type: "document_missing_exception",
          reason: "document missing",
        },
        status: 404,
      });
      return;
    }

    sendJson(res, 200, {
      _index: index,
      _id: id,
      _version: 1,
      found: true,
      _source: docs.get(id),
    });
    return;
  }

  if ((req.method === "POST" || req.method === "GET") && parts.length === 2 && parts[1] === "_refresh") {
    sendJson(res, 200, {
      _shards: { total: 1, successful: 1, failed: 0 },
    });
    return;
  }

  if (req.method === "POST" && parts.length === 2 && parts[1] === "_search") {
    const index = parts[0];
    const docs = indexes.get(index) ?? new Map();
    const body = await readJsonBody(req);

    let hits = [...docs.entries()].map(([id, source]) => ({
      _index: index,
      _id: id,
      _score: 1,
      _source: source,
    }));

    const matchQuery = body?.query?.match;
    if (matchQuery && typeof matchQuery === "object") {
      const [field, value] = Object.entries(matchQuery)[0];
      const needle = String(value).toLowerCase();
      hits = hits.filter((hit) => String(hit._source?.[field] ?? "").toLowerCase().includes(needle));
    }

    sendJson(res, 200, {
      took: 1,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
      hits: {
        total: { value: hits.length, relation: "eq" },
        max_score: hits.length > 0 ? 1 : null,
        hits,
      },
    });
    return;
  }

  sendJson(res, 404, { error: "Not Found", path: pathname });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
