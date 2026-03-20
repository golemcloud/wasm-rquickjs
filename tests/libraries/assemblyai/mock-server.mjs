import http from 'node:http';

const PORT = 18080;
const HOST = '127.0.0.1';

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const readBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  if (req.method === 'GET' && path === '/health') {
    return json(res, 200, { status: 'ok' });
  }

  if (req.headers.authorization !== 'test-api-key') {
    return json(res, 401, { error: 'Unauthorized' });
  }

  if (req.method === 'POST' && path === '/v2/upload') {
    const body = await readBody(req);
    return json(res, 200, {
      upload_url: `https://cdn.mock.local/uploaded-${body.length}.wav`,
    });
  }

  if (req.method === 'POST' && path === '/v2/transcript') {
    const body = JSON.parse((await readBody(req)).toString('utf8'));
    if (!body.audio_url) {
      return json(res, 400, { error: 'audio_url is required' });
    }
    return json(res, 200, {
      id: 'tr_mock_1',
      status: 'queued',
      audio_url: body.audio_url,
      text: '',
    });
  }

  if (req.method === 'GET' && path === '/v2/transcript/tr_mock_1') {
    return json(res, 200, {
      id: 'tr_mock_1',
      status: 'completed',
      audio_url: 'https://cdn.mock.local/uploaded-4.wav',
      text: 'hello from mock transcript',
      words: [],
      utterances: [],
      confidence: 0.99,
      language_code: 'en_us',
    });
  }

  if (req.method === 'GET' && path === '/v2/transcript/tr_mock_1/sentences') {
    return json(res, 200, {
      id: 'tr_mock_1',
      status: 'completed',
      text: 'hello from mock transcript',
      sentences: [{ text: 'hello from mock transcript', start: 0, end: 1200 }],
    });
  }

  if (req.method === 'GET' && path === '/v2/transcript/tr_mock_1/paragraphs') {
    return json(res, 200, {
      id: 'tr_mock_1',
      status: 'completed',
      text: 'hello from mock transcript',
      paragraphs: [{ text: 'hello from mock transcript', start: 0, end: 1200 }],
    });
  }

  if (req.method === 'GET' && path === '/v2/transcript/tr_mock_1/word-search') {
    return json(res, 200, {
      word_search_results: [{ text: 'hello', count: 1 }],
    });
  }

  if (req.method === 'GET' && path === '/v2/transcript/tr_mock_1/srt') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('1\n00:00:00,000 --> 00:00:01,200\nhello from mock transcript\n');
    return;
  }

  if (req.method === 'POST' && path === '/lemur/v3/generate/summary') {
    const body = JSON.parse((await readBody(req)).toString('utf8'));
    return json(res, 200, {
      request_id: 'lemur_req_1',
      response: `summary for ${body.transcript_ids?.[0] || 'unknown'}`,
      usage: { input_tokens: 12, output_tokens: 6 },
    });
  }

  if (req.method === 'POST' && path === '/v2/realtime/token') {
    const body = JSON.parse((await readBody(req)).toString('utf8'));
    return json(res, 200, {
      token: `rt-temp-${body.expires_in ?? 60}`,
    });
  }

  if (req.method === 'GET' && path === '/v3/token') {
    return json(res, 200, {
      token: `stream-temp-${url.searchParams.get('expires_in_seconds') || '60'}`,
    });
  }

  return json(res, 404, { error: 'Not Found', path });
});

server.listen(PORT, HOST, () => {
  console.log(`Mock server listening on http://${HOST}:${PORT}`);
});
