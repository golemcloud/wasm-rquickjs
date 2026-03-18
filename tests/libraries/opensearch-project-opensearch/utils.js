import { Connection } from "@opensearch-project/opensearch";
import { Readable } from "node:stream";

export function unwrapBody(result) {
  return result && Object.prototype.hasOwnProperty.call(result, "body") ? result.body : result;
}

export function createMockConnection(onRequest) {
  return class MockConnection extends Connection {
    request(params, callback) {
      try {
        const response = onRequest(params) || {};
        const statusCode = response.statusCode ?? 200;
        const headers = {
          "content-type": "application/json; charset=utf-8",
          date: new Date().toUTCString(),
          connection: "keep-alive",
          ...(response.headers || {}),
        };

        const responseBody =
          typeof response.body === "string"
            ? response.body
            : JSON.stringify(response.body ?? {});

        headers["content-length"] = Buffer.byteLength(responseBody);

        const stream = Readable.from([responseBody]);
        stream.statusCode = statusCode;
        stream.headers = headers;

        queueMicrotask(() => callback(null, stream));
      } catch (error) {
        queueMicrotask(() => callback(error));
      }

      return {
        abort() {},
      };
    }
  };
}

export function createMockState() {
  return {
    indexes: new Map(),
  };
}

function ensureIndex(state, index) {
  if (!state.indexes.has(index)) {
    state.indexes.set(index, new Map());
  }
  return state.indexes.get(index);
}

function parseNdjsonLines(input) {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export function createApiMockHandler(state, options = {}) {
  return (params) => {
    const method = params.method.toUpperCase();
    const path = params.path;

    if (method === "HEAD" && path === "/") {
      return { statusCode: 200, body: "" };
    }

    if (method === "GET" && path === "/") {
      return {
        statusCode: 200,
        body: {
          name: "opensearch-test-node",
          cluster_name: "opensearch-test-cluster",
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
        },
      };
    }

    if (method === "PUT" && /^\/[^/]+$/.test(path)) {
      const index = decodeURIComponent(path.slice(1));
      ensureIndex(state, index);
      return {
        statusCode: 200,
        body: {
          acknowledged: true,
          shards_acknowledged: true,
          index,
        },
      };
    }

    if (method === "DELETE" && /^\/[^/]+$/.test(path)) {
      const index = decodeURIComponent(path.slice(1));
      state.indexes.delete(index);
      return {
        statusCode: 200,
        body: {
          acknowledged: true,
        },
      };
    }

    const docMatch = path.match(/^\/([^/]+)\/_doc\/([^/]+)$/);
    if (docMatch && method === "PUT") {
      const index = decodeURIComponent(docMatch[1]);
      const id = decodeURIComponent(docMatch[2]);
      const docs = ensureIndex(state, index);
      const source = JSON.parse(params.body);
      const existed = docs.has(id);
      docs.set(id, source);
      return {
        statusCode: existed ? 200 : 201,
        body: {
          _index: index,
          _id: id,
          _version: existed ? 2 : 1,
          result: existed ? "updated" : "created",
        },
      };
    }

    if (docMatch && method === "GET") {
      const index = decodeURIComponent(docMatch[1]);
      const id = decodeURIComponent(docMatch[2]);
      const docs = state.indexes.get(index);
      if (!docs || !docs.has(id)) {
        return {
          statusCode: 404,
          body: {
            _index: index,
            _id: id,
            found: false,
          },
        };
      }

      return {
        statusCode: 200,
        body: {
          _index: index,
          _id: id,
          found: true,
          _source: docs.get(id),
        },
      };
    }

    const updateMatch = path.match(/^\/([^/]+)\/_update\/([^/]+)$/);
    if (updateMatch && method === "POST") {
      const index = decodeURIComponent(updateMatch[1]);
      const id = decodeURIComponent(updateMatch[2]);
      const docs = ensureIndex(state, index);
      const body = JSON.parse(params.body || "{}");
      const existing = docs.get(id) || {};
      const updated = { ...existing, ...(body.doc || {}) };
      docs.set(id, updated);

      return {
        statusCode: 200,
        body: {
          _index: index,
          _id: id,
          result: "updated",
          _source: updated,
        },
      };
    }

    if (docMatch && method === "DELETE") {
      const index = decodeURIComponent(docMatch[1]);
      const id = decodeURIComponent(docMatch[2]);
      const docs = state.indexes.get(index);
      if (docs) {
        docs.delete(id);
      }
      return {
        statusCode: 200,
        body: {
          _index: index,
          _id: id,
          result: "deleted",
        },
      };
    }

    const refreshMatch = path.match(/^\/([^/]+)\/_refresh$/);
    if (refreshMatch && (method === "POST" || method === "GET")) {
      return {
        statusCode: 200,
        body: {
          _shards: { total: 1, successful: 1, failed: 0 },
        },
      };
    }

    const searchMatch = path.match(/^\/([^/]+)\/_search$/);
    if (searchMatch && method === "POST") {
      const index = decodeURIComponent(searchMatch[1]);
      const docs = state.indexes.get(index) || new Map();
      const body = JSON.parse(params.body || "{}");

      let hits = Array.from(docs.entries()).map(([id, source]) => ({
        _index: index,
        _id: id,
        _score: 1,
        _source: source,
      }));

      const match = body?.query?.match;
      if (match && typeof match === "object") {
        const [field, value] = Object.entries(match)[0];
        const needle = String(value).toLowerCase();
        hits = hits.filter((hit) => String(hit._source?.[field] || "").toLowerCase().includes(needle));
      }

      return {
        statusCode: 200,
        body: {
          took: 1,
          timed_out: false,
          hits: {
            total: {
              value: hits.length,
              relation: "eq",
            },
            max_score: hits.length ? 1 : null,
            hits,
          },
        },
      };
    }

    const countMatch = path.match(/^\/([^/]+)\/_count$/);
    if (countMatch && (method === "GET" || method === "POST")) {
      const index = decodeURIComponent(countMatch[1]);
      const docs = state.indexes.get(index) || new Map();
      return {
        statusCode: 200,
        body: {
          count: docs.size,
          _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
        },
      };
    }

    if (path === "/_bulk" && method === "POST") {
      if (options.onBulk) {
        return options.onBulk(params, state, parseNdjsonLines);
      }

      const lines = parseNdjsonLines(params.body || "");
      const items = [];
      for (let i = 0; i < lines.length; i += 2) {
        const action = lines[i];
        const payload = lines[i + 1] || {};
        const [op, meta] = Object.entries(action)[0];
        const index = meta._index;
        const id = meta._id;
        const docs = ensureIndex(state, index);

        if (op === "delete") {
          docs.delete(id);
          items.push({ delete: { _index: index, _id: id, status: 200, result: "deleted" } });
          continue;
        }

        if (op === "update") {
          const current = docs.get(id) || {};
          docs.set(id, { ...current, ...(payload.doc || {}) });
          items.push({ update: { _index: index, _id: id, status: 200, result: "updated" } });
          continue;
        }

        docs.set(id, payload);
        items.push({ [op]: { _index: index, _id: id, status: 201, result: "created" } });
      }

      return {
        statusCode: 200,
        body: {
          took: 1,
          errors: false,
          items,
        },
      };
    }

    return {
      statusCode: 404,
      body: {
        error: {
          type: "not_found",
          reason: `No mock route for ${method} ${path}`,
        },
        status: 404,
      },
    };
  };
}
