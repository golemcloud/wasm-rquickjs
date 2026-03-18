import http from 'node:http';

const PORT = 18080;

const readLength = (view, state, ai) => {
  if (ai < 24) return ai;
  if (ai === 24) return view.getUint8(state.offset++);
  if (ai === 25) {
    const value = view.getUint16(state.offset);
    state.offset += 2;
    return value;
  }
  if (ai === 26) {
    const value = view.getUint32(state.offset);
    state.offset += 4;
    return value;
  }
  if (ai === 27) {
    const value = Number(view.getBigUint64(state.offset));
    state.offset += 8;
    return value;
  }
  throw new Error(`Unsupported CBOR additional info: ${ai}`);
};

const decodeCbor = (bytes) => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const state = { offset: 0 };

  const readValue = () => {
    const initial = view.getUint8(state.offset++);
    const major = initial >> 5;
    const ai = initial & 0x1f;

    if (major === 0) return readLength(view, state, ai);
    if (major === 1) return -1 - readLength(view, state, ai);
    if (major === 2) {
      const len = readLength(view, state, ai);
      const chunk = bytes.subarray(state.offset, state.offset + len);
      state.offset += len;
      return chunk;
    }
    if (major === 3) {
      const len = readLength(view, state, ai);
      const chunk = bytes.subarray(state.offset, state.offset + len);
      state.offset += len;
      return new TextDecoder().decode(chunk);
    }
    if (major === 4) {
      const len = readLength(view, state, ai);
      const arr = [];
      for (let i = 0; i < len; i += 1) arr.push(readValue());
      return arr;
    }
    if (major === 5) {
      const len = readLength(view, state, ai);
      const obj = {};
      for (let i = 0; i < len; i += 1) {
        const key = readValue();
        obj[key] = readValue();
      }
      return obj;
    }
    if (major === 6) {
      // Ignore semantic tags in this mock and decode the tagged payload directly.
      readLength(view, state, ai);
      return readValue();
    }
    if (major === 7) {
      if (ai === 20) return false;
      if (ai === 21) return true;
      if (ai === 22) return null;
      if (ai === 23) return undefined;
    }

    throw new Error(`Unsupported CBOR type: major=${major} ai=${ai}`);
  };

  return readValue();
};

const encodeLength = (major, len) => {
  if (len < 24) return Uint8Array.from([(major << 5) | len]);
  if (len < 0x100) return Uint8Array.from([(major << 5) | 24, len]);
  if (len < 0x10000) return Uint8Array.from([(major << 5) | 25, len >> 8, len & 0xff]);
  const bytes = new Uint8Array(5);
  bytes[0] = (major << 5) | 26;
  new DataView(bytes.buffer).setUint32(1, len);
  return bytes;
};

const concatBytes = (parts) => {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
};

const encodeCbor = (value) => {
  if (value === null) return Uint8Array.from([0xf6]);
  if (value === false) return Uint8Array.from([0xf4]);
  if (value === true) return Uint8Array.from([0xf5]);

  if (typeof value === 'number') {
    if (!Number.isInteger(value)) throw new Error('Only integer numbers are supported in mock CBOR encoder');
    if (value >= 0) return encodeLength(0, value);
    return encodeLength(1, -1 - value);
  }

  if (typeof value === 'string') {
    const bytes = new TextEncoder().encode(value);
    return concatBytes([encodeLength(3, bytes.length), bytes]);
  }

  if (Array.isArray(value)) {
    const items = value.map(encodeCbor);
    return concatBytes([encodeLength(4, items.length), ...items]);
  }

  if (value instanceof Uint8Array) {
    return concatBytes([encodeLength(2, value.length), value]);
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined);
    const encodedEntries = entries.flatMap(([k, v]) => [encodeCbor(k), encodeCbor(v)]);
    return concatBytes([encodeLength(5, entries.length), ...encodedEntries]);
  }

  throw new Error(`Unsupported type for mock CBOR encoder: ${typeof value}`);
};

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const sendRpc = (res, body) => {
  const bytes = encodeCbor(body);
  res.writeHead(200, { 'Content-Type': 'application/cbor' });
  res.end(Buffer.from(bytes));
};

const server = http.createServer((req, res) => {
  const url = req.url?.split('?')[0] ?? '';

  if (req.method === 'GET' && url === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'POST' && url === '/rpc') {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks);
        const request = decodeCbor(new Uint8Array(body));
        const id = request.id ?? 0;
        const method = request.method;

        if (method === 'version') {
          sendRpc(res, { id, result: 'surrealdb-2.2.0' });
          return;
        }

        if (method === 'health') {
          sendRpc(res, { id, result: null });
          return;
        }

        if (method === 'signin') {
          sendRpc(res, { id, result: 'mock-access-token' });
          return;
        }

        if (method === 'query') {
          const queryText = request.params?.[0] ?? '';
          if (typeof queryText === 'string' && queryText.includes('BAD_QUERY')) {
            sendRpc(res, {
              id,
              error: {
                code: -32700,
                kind: 'Validation',
                message: 'Mock validation error',
                details: 'synthetic parse failure',
              },
            });
            return;
          }

          sendRpc(res, {
            id,
            result: [
              {
                status: 'OK',
                time: '1ms',
                result: [42],
              },
            ],
          });
          return;
        }

        sendRpc(res, {
          id,
          error: {
            code: -32601,
            kind: 'NotFound',
            message: `Unsupported mock method: ${String(method)}`,
            details: 'this route only implements version/health/signin/query',
          },
        });
      } catch (error) {
        sendJson(res, 500, { error: String(error?.message ?? error) });
      }
    });
    return;
  }

  sendJson(res, 404, { error: 'Not Found', path: req.url });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
