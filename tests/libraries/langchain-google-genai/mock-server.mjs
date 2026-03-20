import http from 'node:http';

const PORT = 18080;

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });

const extractFirstTextPart = (requestBody) => {
  const contents = Array.isArray(requestBody?.contents) ? requestBody.contents : [];
  for (const content of contents) {
    const parts = Array.isArray(content?.parts) ? content.parts : [];
    for (const part of parts) {
      if (typeof part?.text === 'string') {
        return part.text;
      }
    }
  }
  return '';
};

const extractBatchTexts = (requestBody) => {
  const requests = Array.isArray(requestBody?.requests) ? requestBody.requests : [];
  return requests.map((entry) => {
    const parts = Array.isArray(entry?.content?.parts) ? entry.content.parts : [];
    const textPart = parts.find((part) => typeof part?.text === 'string');
    return textPart?.text ?? '';
  });
};

const server = http.createServer(async (req, res) => {
  const path = req.url?.split('?')[0] ?? '/';

  if (req.method === 'GET' && path === '/health') {
    return sendJson(res, 200, { status: 'ok' });
  }

  if (req.method === 'POST' && /^\/v1beta\/models\/[^/]+:generateContent$/.test(path)) {
    const rawBody = await readBody(req);
    const requestBody = rawBody ? JSON.parse(rawBody) : {};
    const prompt = extractFirstTextPart(requestBody);

    if (prompt === 'TRIGGER_HTTP_ERROR') {
      return sendJson(res, 429, {
        error: {
          code: 429,
          status: 'RESOURCE_EXHAUSTED',
          message: 'Mock rate limit exceeded',
        },
      });
    }

    if (prompt === 'CHECK_HEADERS') {
      const hasApiKeyHeader = req.headers['x-goog-api-key'] === 'test-key';
      const hasExtraHeader = req.headers['x-extra-header'] === 'present';
      if (!hasApiKeyHeader || !hasExtraHeader) {
        return sendJson(res, 400, {
          error: {
            code: 400,
            status: 'INVALID_ARGUMENT',
            message: 'Missing expected Google auth/custom headers',
          },
        });
      }

      return sendJson(res, 200, {
        candidates: [
          {
            index: 0,
            finishReason: 'STOP',
            content: {
              role: 'model',
              parts: [{ text: 'HEADERS_OK' }],
            },
            safetyRatings: [],
          },
        ],
        usageMetadata: {
          promptTokenCount: 4,
          candidatesTokenCount: 1,
          totalTokenCount: 5,
        },
      });
    }

    return sendJson(res, 200, {
      candidates: [
        {
          index: 0,
          finishReason: 'STOP',
          content: {
            role: 'model',
            parts: [{ text: `MOCK_RESPONSE:${prompt}` }],
          },
          safetyRatings: [],
        },
      ],
      usageMetadata: {
        promptTokenCount: 4,
        candidatesTokenCount: 2,
        totalTokenCount: 6,
      },
    });
  }

  if (req.method === 'POST' && /^\/v1beta\/models\/[^/]+:embedContent$/.test(path)) {
    const rawBody = await readBody(req);
    const requestBody = rawBody ? JSON.parse(rawBody) : {};
    const inputText = extractFirstTextPart({ contents: [requestBody.content] });
    const base = inputText.length;
    return sendJson(res, 200, {
      embedding: {
        values: [base + 0.1, base + 0.2, base + 0.3],
      },
    });
  }

  if (req.method === 'POST' && /^\/v1beta\/models\/[^/]+:batchEmbedContents$/.test(path)) {
    const rawBody = await readBody(req);
    const requestBody = rawBody ? JSON.parse(rawBody) : {};
    const texts = extractBatchTexts(requestBody);
    const embeddings = texts.map((text) => {
      const base = text.length;
      return {
        values: [base + 0.1, base + 0.2, base + 0.3],
      };
    });
    return sendJson(res, 200, { embeddings });
  }

  return sendJson(res, 404, { error: 'Not Found', path });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
