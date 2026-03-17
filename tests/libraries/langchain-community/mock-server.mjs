import http from 'node:http';

const PORT = 18080;

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const sendText = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(payload);
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, { status: 'ok' });
  }

  if (req.method === 'GET' && url.pathname === '/wikipedia/api.php') {
    const action = url.searchParams.get('action');
    const list = url.searchParams.get('list');
    const prop = url.searchParams.get('prop');

    if (action === 'query' && list === 'search') {
      return sendJson(res, 200, {
        query: {
          search: [
            { title: 'Golem' },
            { title: 'LangChain' },
          ],
        },
      });
    }

    if (action === 'query' && prop === 'extracts') {
      const title = url.searchParams.get('titles') || 'Unknown';
      return sendJson(res, 200, {
        query: {
          pages: {
            1: {
              pageid: 1,
              title,
              extract: `${title} is a cloud for durable workers.`,
            },
          },
        },
      });
    }

    return sendJson(res, 400, { error: 'Bad wikipedia request' });
  }

  if (req.method === 'POST' && url.pathname === '/searxng/search') {
    return sendJson(res, 200, {
      results: [
        {
          title: 'LangChain Community Docs',
          url: 'https://docs.example/langchain-community',
          content: 'Community integrations and utilities.',
        },
        {
          title: 'Golem LangChain Guide',
          url: 'https://docs.example/golem-langchain',
          content: 'Run LangChain components on Golem.',
        },
      ],
      answers: [],
      infoboxes: [],
      suggestions: [],
    });
  }

  if (req.method === 'GET' && url.pathname === '/page') {
    return sendText(
      res,
      200,
      '<!doctype html><html><head><title>Mock Community Page</title></head><body><div id="content">LangChain community loader content</div></body></html>'
    );
  }

  return sendJson(res, 404, { error: 'Not Found', path: url.pathname });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
