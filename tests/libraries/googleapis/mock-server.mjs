import http from 'node:http';

const PORT = 18080;

const sendJson = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/customsearch/v1') {
    if (url.searchParams.get('q') === 'trigger-error') {
      sendJson(res, 500, { error: { code: 500, message: 'mock internal error' } });
      return;
    }

    sendJson(res, 200, {
      kind: 'customsearch#search',
      searchInformation: {
        totalResults: '1',
        formattedTotalResults: '1',
        searchTime: 0.01,
      },
      items: [
        {
          title: 'wasm-rquickjs repository',
          link: 'https://github.com/golemcloud/wasm-rquickjs',
          snippet: 'Mock search result',
        },
      ],
      queries: {
        request: [
          {
            title: 'Google Custom Search - wasm-rquickjs',
            totalResults: '1',
            searchTerms: url.searchParams.get('q') ?? '',
            count: 1,
            startIndex: 1,
          },
        ],
      },
    });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/books/v1/volumes') {
    sendJson(res, 200, {
      kind: 'books#volumes',
      totalItems: 1,
      items: [
        {
          id: 'mock-volume-id',
          volumeInfo: {
            title: 'Mock Book',
            authors: ['Mock Author'],
          },
        },
      ],
    });
    return;
  }

  sendJson(res, 404, { error: 'Not Found', method: req.method, path: url.pathname });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
