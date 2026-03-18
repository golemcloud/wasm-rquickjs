import http from 'node:http';

const PORT = 18080;

const state = {
  traceRequests: 0,
  telemetryRequests: 0,
  remoteConfigRequests: 0,
  statsRequests: 0,
  lastTracePath: null,
  lastTraceBytes: 0,
};

const resetState = () => {
  state.traceRequests = 0;
  state.telemetryRequests = 0;
  state.remoteConfigRequests = 0;
  state.statsRequests = 0;
  state.lastTracePath = null;
  state.lastTraceBytes = 0;
};

const readBody = (request) => new Promise((resolve, reject) => {
  const chunks = [];
  request.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
  request.on('end', () => resolve(Buffer.concat(chunks)));
  request.on('error', reject);
});

const json = (response, statusCode, value) => {
  response.writeHead(statusCode, { 'content-type': 'application/json' });
  response.end(JSON.stringify(value));
};

const server = http.createServer(async (request, response) => {
  const path = request.url.split('?')[0];

  if (request.method === 'GET' && path === '/health') {
    json(response, 200, { status: 'ok' });
    return;
  }

  if (request.method === 'GET' && path === '/state') {
    json(response, 200, state);
    return;
  }

  if (request.method === 'POST' && path === '/reset') {
    await readBody(request);
    resetState();
    json(response, 200, { ok: true });
    return;
  }

  if (request.method === 'PUT' && (path === '/v0.4/traces' || path === '/v0.5/traces')) {
    const body = await readBody(request);
    state.traceRequests += 1;
    state.lastTracePath = path;
    state.lastTraceBytes = body.length;
    json(response, 200, { rate_by_service: { 'service:,env:': 1 } });
    return;
  }

  if (request.method === 'POST' && path === '/telemetry/proxy/api/v2/apmtelemetry') {
    await readBody(request);
    state.telemetryRequests += 1;
    json(response, 202, { ok: true });
    return;
  }

  if (request.method === 'POST' && path === '/v0.7/config') {
    await readBody(request);
    state.remoteConfigRequests += 1;
    json(response, 200, {});
    return;
  }

  if (request.method === 'POST' && path === '/v0.6/stats') {
    await readBody(request);
    state.statsRequests += 1;
    json(response, 200, { ok: true });
    return;
  }

  json(response, 404, { error: 'Not Found', method: request.method, path });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
