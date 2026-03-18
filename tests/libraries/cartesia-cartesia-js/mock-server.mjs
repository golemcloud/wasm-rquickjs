import http from 'node:http';

const PORT = 18080;

const voices = [
  {
    id: 'voice-1',
    created_at: '2026-01-01T00:00:00.000Z',
    description: 'Mock voice Ada',
    is_owner: true,
    is_public: false,
    language: 'en',
    name: 'Ada',
  },
  {
    id: 'voice-2',
    created_at: '2026-01-01T00:00:00.000Z',
    description: 'Mock voice Bob',
    is_owner: true,
    is_public: false,
    language: 'en',
    name: 'Bob',
  },
  {
    id: 'voice-3',
    created_at: '2026-01-01T00:00:00.000Z',
    description: 'Mock voice Clara',
    is_owner: false,
    is_public: true,
    language: 'en',
    name: 'Clara',
  },
];

let accessTokenAttempts = 0;

const json = (res, status, body, headers = {}) => {
  res.writeHead(status, {
    'content-type': 'application/json',
    ...headers,
  });
  res.end(JSON.stringify(body));
};

const readJsonBody = async (req) => {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }
  if (!body) return {};
  return JSON.parse(body);
};

const isAuthorized = (req) => req.headers.authorization === 'Bearer test-token';

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (req.method === 'GET' && path === '/health') {
    return json(res, 200, { status: 'ok' });
  }

  if (!isAuthorized(req)) {
    return json(res, 401, {
      error: {
        message: 'Unauthorized',
        type: 'authentication_error',
      },
    });
  }

  if (req.method === 'GET' && path === '/') {
    return json(res, 200, {
      status: 'ok',
      version: 'mock-2026-03-18',
    });
  }

  if (req.method === 'GET' && path === '/voices') {
    const limit = Number.parseInt(url.searchParams.get('limit') || '3', 10);
    const query = (url.searchParams.get('q') || '').toLowerCase();
    const includePreview = url.searchParams.getAll('expand[]').includes('preview_file_url');

    let filtered = voices;
    if (query) {
      filtered = voices.filter(
        (voice) =>
          voice.id.toLowerCase().includes(query) ||
          voice.name.toLowerCase().includes(query) ||
          voice.description.toLowerCase().includes(query),
      );
    }

    const data = filtered.slice(0, Number.isFinite(limit) ? limit : 3).map((voice) => {
      if (!includePreview) return voice;
      return {
        ...voice,
        preview_file_url: `http://localhost:${PORT}/preview/${voice.id}.wav`,
      };
    });

    return json(
      res,
      200,
      {
        data,
      },
      { 'x-mock-route': 'voices-list' },
    );
  }

  if (req.method === 'GET' && path.startsWith('/voices/')) {
    const id = path.split('/')[2];
    const voice = voices.find((item) => item.id === id);

    if (!voice) {
      return json(res, 404, {
        error: {
          message: `Voice ${id} was not found`,
          type: 'not_found_error',
        },
      });
    }

    return json(res, 200, voice, { 'x-mock-route': 'voices-get' });
  }

  if (req.method === 'POST' && path === '/access-token') {
    accessTokenAttempts += 1;

    if (accessTokenAttempts === 1) {
      return json(
        res,
        429,
        {
          error: {
            message: 'Rate limited once intentionally for retry testing',
            type: 'rate_limit_error',
          },
        },
        { 'retry-after': '0' },
      );
    }

    const body = await readJsonBody(req);
    const expiresIn = body.expires_in ?? 0;
    const hasTtsGrant = Boolean(body.grants?.tts);

    return json(
      res,
      200,
      {
        token: `generated-token-${expiresIn}-${hasTtsGrant ? 'tts' : 'none'}`,
      },
      { 'x-mock-route': 'access-token-create' },
    );
  }

  return json(res, 404, {
    error: {
      message: `No route for ${req.method} ${path}`,
      type: 'not_found_error',
    },
  });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
