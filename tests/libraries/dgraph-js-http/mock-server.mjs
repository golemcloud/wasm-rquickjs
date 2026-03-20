import http from 'node:http';

const PORT = 18080;

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body.length > 0 ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function replyJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('healthy');
    return;
  }

  if (req.method === 'POST' && url.pathname === '/login') {
    const body = await readJsonBody(req);
    if (body.userid !== 'groot' || body.password !== 'password') {
      replyJson(res, 400, { errors: [{ message: 'invalid login payload' }] });
      return;
    }

    replyJson(res, 200, {
      data: {
        accessJWT: 'access-token-123',
        refreshJWT: 'refresh-token-123',
      },
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/query') {
    if (req.headers['x-dgraph-accesstoken'] !== 'access-token-123') {
      replyJson(res, 401, { errors: [{ message: 'missing access token header' }] });
      return;
    }

    if (req.headers['content-type'] !== 'application/json') {
      replyJson(res, 400, { errors: [{ message: 'query content-type mismatch' }] });
      return;
    }

    const body = await readJsonBody(req);

    if (!body.variables || body.variables.$name !== 'Alice') {
      replyJson(res, 400, { errors: [{ message: 'query variables mismatch' }] });
      return;
    }

    if (body.variables.$ignored !== undefined) {
      replyJson(res, 400, { errors: [{ message: 'non-string variable should be dropped' }] });
      return;
    }

    if (url.searchParams.get('timeout') !== '600s' || url.searchParams.get('ro') !== 'true') {
      replyJson(res, 400, { errors: [{ message: 'query params mismatch' }] });
      return;
    }

    replyJson(res, 200, {
      data: { q: [{ uid: '0x1', name: 'Alice' }] },
      extensions: {
        txn: {
          start_ts: 101,
          keys: ['k1'],
          preds: ['name'],
          hash: 'hash-101',
        },
      },
    });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/mutate') {
    if (req.headers['content-type'] !== 'application/json') {
      replyJson(res, 400, { errors: [{ message: 'mutation content-type mismatch' }] });
      return;
    }

    if (url.searchParams.get('commitNow') !== 'true') {
      replyJson(res, 400, { errors: [{ message: 'commitNow query flag missing' }] });
      return;
    }

    const body = await readJsonBody(req);

    if (!body.set || body.set.name !== 'Alice') {
      replyJson(res, 400, { errors: [{ message: 'mutation body mismatch' }] });
      return;
    }

    replyJson(res, 200, {
      data: { code: 'Success' },
      extensions: {
        txn: {
          start_ts: 202,
          keys: ['k2'],
          preds: ['name'],
          hash: 'hash-202',
        },
      },
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/state') {
    replyJson(res, 503, { errors: [{ message: 'state unavailable' }] });
    return;
  }

  replyJson(res, 404, { errors: [{ message: `Unhandled route: ${req.method} ${url.pathname}` }] });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
