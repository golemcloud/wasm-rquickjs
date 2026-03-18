import http from 'node:http';

const PORT = 18080;
const BASE_PATH = '/dream-machine/v1';

const readJsonBody = (req) => new Promise((resolve, reject) => {
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

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const routeKey = `${req.method} ${url.pathname}`;

  if (routeKey === 'GET /health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (routeKey === `GET ${BASE_PATH}/ping`) {
    sendJson(res, 200, { message: 'pong' });
    return;
  }

  if (routeKey === `POST ${BASE_PATH}/generations/image`) {
    try {
      const body = await readJsonBody(req);
      sendJson(res, 200, {
        id: 'gen-image-int-1',
        state: 'queued',
        generation_type: 'image',
        model: body.model ?? 'photon-1',
        request: body,
      });
    } catch {
      sendJson(res, 400, { message: 'Invalid JSON body' });
    }
    return;
  }

  if (routeKey === `GET ${BASE_PATH}/generations`) {
    const limit = Number(url.searchParams.get('limit') ?? '0');
    const offset = Number(url.searchParams.get('offset') ?? '0');
    sendJson(res, 200, {
      generations: [
        {
          id: 'gen-complete-1',
          state: 'completed',
          generation_type: 'image',
          assets: { image: 'https://example.com/result-1.png' },
        },
        {
          id: 'gen-complete-2',
          state: 'completed',
          generation_type: 'image',
          assets: { image: 'https://example.com/result-2.png' },
        },
      ],
      count: 2,
      has_more: false,
      limit,
      offset,
    });
    return;
  }

  if (routeKey === `GET ${BASE_PATH}/generations/gen-complete-1`) {
    sendJson(res, 200, {
      id: 'gen-complete-1',
      state: 'completed',
      generation_type: 'image',
      assets: { image: 'https://example.com/result-1.png' },
    });
    return;
  }

  sendJson(res, 404, {
    message: 'Not Found',
    method: req.method,
    path: url.pathname,
  });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
