import http from 'node:http';

const PORT = 18080;

const json = (res, statusCode, payload) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

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
    } catch (err) {
      reject(err);
    }
  });
  req.on('error', reject);
});

const server = http.createServer(async (req, res) => {
  const path = req.url.split('?')[0];

  if (req.method === 'GET' && path === '/health') {
    json(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'POST' && path === '/search') {
    const body = await readJsonBody(req);
    json(res, 200, {
      requestId: 'search-1',
      autopromptString: body.query,
      results: [
        {
          id: 'result-1',
          title: 'Example Result',
          url: 'https://example.com/article',
          text: 'Example article content from mock search',
        },
      ],
    });
    return;
  }

  if (req.method === 'POST' && path === '/contents') {
    const body = await readJsonBody(req);
    json(res, 200, {
      requestId: 'contents-1',
      results: (body.urls || []).map((url) => ({
        id: `content-${url}`,
        url,
        text: `Fetched content for ${url}`,
      })),
    });
    return;
  }

  if (req.method === 'POST' && path === '/answer') {
    const body = await readJsonBody(req);

    if (body.stream) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
      });

      res.write('data: {"choices":[{"delta":{"content":"Hello "}}]}\n');
      res.write('\n');
      res.write('data: {"choices":[{"delta":{"content":"world"}}],"citations":[{"id":"cit-1","url":"https://example.com/source","title":"Mock Source","text":"Mock citation text"}]}\n');
      res.write('\n');
      res.write('data: [DONE]\n');
      res.write('\n');
      res.end();
      return;
    }

    json(res, 200, {
      requestId: 'answer-1',
      answer: 'Deterministic mock answer',
      citations: [
        {
          id: 'cit-1',
          url: 'https://example.com/source',
          title: 'Mock Source',
          text: 'Mock citation text',
        },
      ],
    });
    return;
  }

  json(res, 404, { error: 'Not Found', path });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
