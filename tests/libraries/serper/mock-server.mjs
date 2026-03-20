import http from 'node:http';

const PORT = 18080;
const VALID_API_KEY = 'test-serper-key';

const counters = {
  search: 0,
  news: 0,
  images: 0,
  videos: 0,
  places: 0,
};

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const parseRequestBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  const text = Buffer.concat(chunks).toString('utf8').trim();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
};

const unauthorizedResponse = {
  error: 'Unauthorized',
  message: 'Invalid x-api-key',
};

const requireAuth = (req, res) => {
  if (req.headers['x-api-key'] !== VALID_API_KEY) {
    sendJson(res, 401, unauthorizedResponse);
    return false;
  }
  return true;
};

const buildSearchPayload = (body, requestId) => ({
  searchParameters: {
    q: body.q ?? '',
    page: body.page ?? 1,
    type: 'search',
  },
  organic: [
    {
      title: `${body.q} organic result ${requestId}`,
      link: `https://example.com/search/${requestId}`,
      snippet: `Request ${requestId} for ${body.q}`,
      position: 1,
    },
  ],
  peopleAlsoAsk: [],
  relatedSearches: [],
  requestId,
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  if (!requireAuth(req, res)) {
    return;
  }

  const body = await parseRequestBody(req);

  if (url.pathname === '/search') {
    counters.search += 1;
    sendJson(res, 200, buildSearchPayload(body, counters.search));
    return;
  }

  if (url.pathname === '/news') {
    counters.news += 1;
    sendJson(res, 200, {
      searchParameters: { q: body.q ?? '', page: body.page ?? 1, type: 'news' },
      news: [
        {
          title: `${body.q} headline ${counters.news}`,
          link: `https://example.com/news/${counters.news}`,
          snippet: `News snippet ${counters.news}`,
          source: 'Mock News',
          position: 1,
        },
      ],
    });
    return;
  }

  if (url.pathname === '/images') {
    counters.images += 1;
    sendJson(res, 200, {
      searchParameters: { q: body.q ?? '', page: body.page ?? 1, type: 'images' },
      images: [
        {
          title: `${body.q} image ${counters.images}`,
          imageUrl: `https://example.com/images/${counters.images}.jpg`,
          thumbnailUrl: `https://example.com/images/${counters.images}-thumb.jpg`,
          position: 1,
        },
      ],
    });
    return;
  }

  if (url.pathname === '/videos') {
    counters.videos += 1;
    sendJson(res, 200, {
      searchParameters: { q: body.q ?? '', page: body.page ?? 1, type: 'videos' },
      videos: [
        {
          title: `${body.q} video ${counters.videos}`,
          link: `https://example.com/videos/${counters.videos}`,
          imageUrl: `https://example.com/videos/${counters.videos}.jpg`,
          position: 1,
        },
      ],
    });
    return;
  }

  if (url.pathname === '/places') {
    counters.places += 1;
    sendJson(res, 200, {
      searchParameters: { q: body.q ?? '', page: body.page ?? 1, type: 'places' },
      places: [
        {
          title: `${body.q} place ${counters.places}`,
          address: `${counters.places} Example Street`,
          latitude: 47.49,
          longitude: 19.04,
          position: 1,
        },
      ],
    });
    return;
  }

  sendJson(res, 404, { error: 'Not Found', path: url.pathname });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
