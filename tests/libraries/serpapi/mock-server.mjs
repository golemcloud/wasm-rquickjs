import http from 'node:http';

const PORT = 18080;
const VALID_API_KEY = 'test-serpapi-key';

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const sendHtml = (res, status, html) => {
  res.writeHead(status, { 'Content-Type': 'text/html' });
  res.end(html);
};

const isAuthorized = (url) => url.searchParams.get('api_key') === VALID_API_KEY;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const route = url.pathname;

  if (req.method === 'GET' && route === '/health') {
    return sendJson(res, 200, { status: 'ok' });
  }

  if (req.method === 'GET' && route === '/locations.json') {
    const query = url.searchParams.get('q') ?? '';
    const limit = Number(url.searchParams.get('limit') ?? '2');
    const all = [
      { canonical_name: 'Austin,Texas,United States', target_type: 'city' },
      { canonical_name: 'Austin,Quebec,Canada', target_type: 'city' },
      { canonical_name: 'Austin,Arkansas,United States', target_type: 'city' },
    ].filter((row) => row.canonical_name.toLowerCase().includes(query.toLowerCase()));

    return sendJson(res, 200, all.slice(0, Number.isNaN(limit) ? 2 : limit));
  }

  if (!isAuthorized(url)) {
    return sendJson(res, 401, { error: 'Invalid API key' });
  }

  if (req.method === 'GET' && route === '/search') {
    const output = url.searchParams.get('output') ?? 'json';
    const q = url.searchParams.get('q') ?? '';
    const engine = url.searchParams.get('engine') ?? 'google';

    if (output === 'html') {
      return sendHtml(
        res,
        200,
        `<html><body><h1>Mock HTML for ${q}</h1><p>engine=${engine}</p></body></html>`,
      );
    }

    return sendJson(res, 200, {
      search_metadata: { id: 'mock-search-id', status: 'Success' },
      search_parameters: { q, engine },
      organic_results: [
        { position: 1, title: `${q} result 1` },
        { position: 2, title: `${q} result 2` },
      ],
    });
  }

  if (req.method === 'GET' && route.startsWith('/searches/')) {
    const output = url.searchParams.get('output') ?? 'json';
    const id = route.split('/').at(-1);

    if (output === 'html') {
      return sendHtml(res, 200, `<html><body><p>Archived HTML for ${id}</p></body></html>`);
    }

    return sendJson(res, 200, {
      search_metadata: { id, status: 'Cached' },
      search_parameters: { q: 'archived query' },
      organic_results: [{ position: 1, title: `Archived result for ${id}` }],
    });
  }

  if (req.method === 'GET' && route === '/account') {
    return sendJson(res, 200, {
      account_id: 'acct_test_001',
      searches_per_month: 250,
      this_month_usage: 7,
    });
  }

  return sendJson(res, 404, { error: 'Not Found', path: route });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
