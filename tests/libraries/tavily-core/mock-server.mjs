import http from 'node:http';

const PORT = 18080;

const sendJson = (res, statusCode, body) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const readJsonBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
};

const server = http.createServer(async (req, res) => {
  const method = req.method || 'GET';
  const path = (req.url || '/').split('?')[0];

  if (method === 'GET' && path === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (method === 'POST' && path === '/search') {
    const body = await readJsonBody(req);

    if (body.query === 'trigger unauthorized') {
      sendJson(res, 401, { detail: { error: 'Mock unauthorized from Tavily API' } });
      return;
    }

    const isDeprecatedQna = body.include_answer === true && body.search_depth === 'advanced';
    const answer = isDeprecatedQna ? 'Mock answer from searchQNA' : `Mock answer for ${body.query}`;
    sendJson(res, 200, {
      response_time: 0.12,
      images: [{ url: 'https://example.com/img.png', description: 'Mock image' }],
      results: [
        {
          title: 'Mock Tavily Search Result',
          url: 'https://example.com/result',
          content: 'Short content',
          raw_content: 'Long markdown content',
          score: 0.99,
          published_date: '2026-03-18',
          favicon: 'https://example.com/favicon.ico',
        },
      ],
      answer,
      request_id: 'req-search-1',
      usage: { credits: 2 },
    });
    return;
  }

  if (method === 'POST' && path === '/extract') {
    sendJson(res, 200, {
      response_time: 0.08,
      results: [
        {
          url: 'https://example.com/a',
          title: 'A',
          raw_content: '# Extracted markdown',
          images: ['https://example.com/a.png'],
          favicon: 'https://example.com/favicon.ico',
        },
      ],
      failed_results: [
        {
          url: 'https://bad.invalid',
          error: 'DNS failure',
        },
      ],
      request_id: 'req-extract-1',
      usage: { credits: 1 },
    });
    return;
  }

  if (method === 'POST' && path === '/map') {
    sendJson(res, 200, {
      response_time: 0.09,
      base_url: 'https://example.com',
      results: ['https://example.com', 'https://example.com/docs'],
      request_id: 'req-map-1',
      usage: { credits: 3 },
    });
    return;
  }

  if (method === 'POST' && path === '/research') {
    const body = await readJsonBody(req);
    sendJson(res, 200, {
      request_id: 'req-research-1',
      created_at: '2026-03-18T00:00:00.000Z',
      status: 'queued',
      input: body.input,
      model: body.model || 'auto',
      response_time: 0.1,
    });
    return;
  }

  if (method === 'GET' && path === '/research/req-research-1') {
    sendJson(res, 200, {
      request_id: 'req-research-1',
      created_at: '2026-03-18T00:00:00.000Z',
      status: 'completed',
      content: 'QuickJS can run Tavily SDK requests through wasi:http.',
      sources: [{ title: 'Mock source', url: 'https://example.com/source' }],
      response_time: 0.22,
    });
    return;
  }

  sendJson(res, 404, { detail: { error: `No mock route for ${method} ${path}` } });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
