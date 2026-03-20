import http from 'node:http';

const PORT = 18080;
const jobs = new Map();
let runCounter = 0;
let queueCounter = 0;

const sendJson = (res, status, body, headers = {}) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    ...headers,
  });
  res.end(JSON.stringify(body));
};

const parseBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const body = Buffer.concat(chunks).toString('utf-8');
  return body.length > 0 ? JSON.parse(body) : {};
};

const normalizePath = (path) => path.replace(/\/+$/, '') || '/';

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'GET' && requestUrl.pathname === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (requestUrl.pathname !== '/proxy') {
    sendJson(res, 404, { error: 'Not Found', path: requestUrl.pathname });
    return;
  }

  const targetHeader = req.headers['x-fal-target-url'];
  if (!targetHeader || Array.isArray(targetHeader)) {
    sendJson(res, 400, { error: 'Missing x-fal-target-url header' });
    return;
  }

  const target = new URL(targetHeader);
  const targetPath = normalizePath(target.pathname);
  const targetMethod = req.method;

  if (target.hostname === 'fal.run' && targetMethod === 'POST' && targetPath === '/fal-ai/test-model') {
    runCounter += 1;
    const payload = await parseBody(req);
    sendJson(
      res,
      200,
      {
        output: `run:${payload.prompt}`,
        authHeader: req.headers.authorization ?? null,
      },
      { 'x-fal-request-id': `run-req-${runCounter}` },
    );
    return;
  }

  if (target.hostname === 'queue.fal.run' && targetMethod === 'POST' && targetPath === '/fal-ai/test-model') {
    queueCounter += 1;
    const requestId = `queue-req-${queueCounter}`;
    const payload = await parseBody(req);

    jobs.set(requestId, {
      prompt: payload.prompt,
      checks: 0,
      canceled: false,
    });

    sendJson(res, 200, { request_id: requestId });
    return;
  }

  const statusMatch = targetPath.match(/^\/fal-ai\/test-model\/requests\/([^/]+)\/status$/);
  if (target.hostname === 'queue.fal.run' && targetMethod === 'GET' && statusMatch) {
    const requestId = statusMatch[1];
    const job = jobs.get(requestId);
    if (!job) {
      sendJson(res, 404, { error: 'Unknown request id', requestId });
      return;
    }

    if (job.canceled) {
      sendJson(res, 200, {
        status: 'CANCELED',
        request_id: requestId,
        response_url: `https://queue.fal.run/fal-ai/test-model/requests/${requestId}`,
      });
      return;
    }

    job.checks += 1;
    if (job.checks === 1) {
      sendJson(res, 200, {
        status: 'IN_QUEUE',
        request_id: requestId,
        response_url: `https://queue.fal.run/fal-ai/test-model/requests/${requestId}`,
      });
      return;
    }

    sendJson(res, 200, {
      status: 'COMPLETED',
      request_id: requestId,
      response_url: `https://queue.fal.run/fal-ai/test-model/requests/${requestId}`,
      logs: [{ message: 'Completed in mock server' }],
    });
    return;
  }

  const resultMatch = targetPath.match(/^\/fal-ai\/test-model\/requests\/([^/]+)$/);
  if (target.hostname === 'queue.fal.run' && targetMethod === 'GET' && resultMatch) {
    const requestId = resultMatch[1];
    const job = jobs.get(requestId);
    if (!job) {
      sendJson(res, 404, { error: 'Unknown request id', requestId });
      return;
    }

    sendJson(
      res,
      200,
      {
        output: `queue:${job.prompt}`,
      },
      { 'x-fal-request-id': `queue-result-${requestId}` },
    );
    return;
  }

  const cancelMatch = targetPath.match(/^\/fal-ai\/test-model\/requests\/([^/]+)\/cancel$/);
  if (target.hostname === 'queue.fal.run' && targetMethod === 'PUT' && cancelMatch) {
    const requestId = cancelMatch[1];
    const job = jobs.get(requestId);
    if (!job) {
      sendJson(res, 404, { error: 'Unknown request id', requestId });
      return;
    }

    job.canceled = true;
    sendJson(res, 200, { status: 'CANCELED' });
    return;
  }

  sendJson(res, 404, {
    error: 'Unhandled target route',
    targetMethod,
    targetHost: target.hostname,
    targetPath,
  });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
