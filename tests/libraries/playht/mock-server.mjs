import http from 'node:http';

const PORT = 18080;

const readJsonBody = (req) =>
  new Promise((resolve, reject) => {
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

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const sendAudio = (res, payload, requestId) => {
  res.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'x-fal-request-id': requestId,
  });
  res.end(Buffer.from(payload));
};

const server = http.createServer(async (req, res) => {
  const route = `${req.method} ${req.url}`;

  if (route === 'GET /health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (route === 'POST /mock/stream/basic') {
    const payload = await readJsonBody(req).catch(() => null);
    if (!payload || payload.voice_engine !== 'PlayDialog' || !payload.text) {
      sendJson(res, 400, { error_message: 'Invalid basic payload' });
      return;
    }
    sendAudio(res, 'AUDIO_BASIC_OK', 'mock-basic-request');
    return;
  }

  if (route === 'POST /mock/stream/payload') {
    const payload = await readJsonBody(req).catch(() => null);
    const hasExpectedFields =
      payload &&
      payload.voice_engine === 'PlayDialog' &&
      payload.language === 'arabic' &&
      payload.output_format === 'wav' &&
      payload.turn_prefix === '[A]:' &&
      payload.turn_prefix_2 === '[B]:' &&
      payload.voice_2 &&
      payload.speed === 1.2;

    if (!hasExpectedFields) {
      sendJson(res, 400, {
        error_message: 'PlayDialog payload fields did not match expectations',
        received: payload,
      });
      return;
    }

    sendAudio(res, 'AUDIO_PAYLOAD_OK', 'mock-payload-request');
    return;
  }

  if (route === 'POST /mock/stream/error') {
    sendJson(res, 429, { error_message: 'Mock rate limit from PlayHT test server' });
    return;
  }

  sendJson(res, 404, { error: 'Not Found', path: req.url });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
