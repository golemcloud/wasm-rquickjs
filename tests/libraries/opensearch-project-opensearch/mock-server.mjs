import http from "node:http";

const PORT = 18080;
const indexes = new Map();

function ensureIndex(index) {
  if (!indexes.has(index)) {
    indexes.set(index, new Map());
  }
  return indexes.get(index);
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "x-opensearch-product-version": "2.15.0",
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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const parts = pathname.split("/").filter(Boolean);

  if (req.method === "GET" && pathname === "/health") {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  if (req.method === "HEAD" && pathname === "/") {
    res.writeHead(200, {
      "x-opensearch-product-version": "2.15.0",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && pathname === "/") {
    sendJson(res, 200, {
      name: "opensearch-mock-node",
      cluster_name: "opensearch-mock-cluster",
      cluster_uuid: "mock-cluster-uuid",
      version: {
        distribution: "opensearch",
        number: "2.15.0",
        build_type: "mock",
        build_hash: "mock-hash",
        build_date: "2026-01-01T00:00:00.000Z",
        build_snapshot: false,
        lucene_version: "9.10.0",
        minimum_wire_compatibility_version: "7.10.0",
        minimum_index_compatibility_version: "7.0.0",
      },
      tagline: "The OpenSearch Project: https://opensearch.org/",
    });
    return;
  }

  if (req.method === "PUT" && parts.length === 1) {
    const [index] = parts;
    ensureIndex(index);
    sendJson(res, 200, {
      acknowledged: true,
      shards_acknowledged: true,
      index,
    });
    return;
  }

  if (req.method === "DELETE" && parts.length === 1) {
    const [index] = parts;
    indexes.delete(index);
    sendJson(res, 200, { acknowledged: true });
    return;
  }

  if (req.method === "PUT" && parts.length === 3 && parts[1] === "_doc") {
    const [index, , id] = parts;
    const docs = ensureIndex(index);
    const source = await readJsonBody(req);
    const existed = docs.has(id);
    docs.set(id, source);
    sendJson(res, existed ? 200 : 201, {
      _index: index,
      _id: id,
      _version: existed ? 2 : 1,
      result: existed ? "updated" : "created",
    });
    return;
  }

  if (req.method === "GET" && parts.length === 3 && parts[1] === "_doc") {
    const [index, , id] = parts;
    const docs = indexes.get(index);
    if (!docs || !docs.has(id)) {
      sendJson(res, 404, {
        _index: index,
        _id: id,
        found: false,
      });
      return;
    }

    sendJson(res, 200, {
      _index: index,
      _id: id,
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
    const [index] = parts;
    const docs = indexes.get(index) || new Map();
    const body = await readJsonBody(req);

    let hits = [...docs.entries()].map(([id, source]) => ({
      _index: index,
      _id: id,
      _score: 1,
      _source: source,
    }));

    const match = body?.query?.match;
    if (match && typeof match === "object") {
      const [field, value] = Object.entries(match)[0];
      const needle = String(value).toLowerCase();
      hits = hits.filter((hit) => String(hit._source?.[field] ?? "").toLowerCase().includes(needle));
    }

    sendJson(res, 200, {
      took: 1,
      timed_out: false,
      hits: {
        total: {
          value: hits.length,
          relation: "eq",
        },
        max_score: hits.length > 0 ? 1 : null,
        hits,
      },
    });
    return;
  }

  sendJson(res, 404, {
    error: "Not Found",
    path: pathname,
  });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
