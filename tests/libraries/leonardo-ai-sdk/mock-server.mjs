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

const json = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const server = http.createServer(async (req, res) => {
  const path = req.url.split('?')[0];

  if (req.method === 'GET' && path === '/health') {
    json(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'GET' && path === '/me') {
    const auth = req.headers.authorization || '';
    if (auth.includes('bad-token')) {
      json(res, 401, { error: 'unauthorized' });
      return;
    }

    json(res, 200, {
      user_details: [
        {
          apiConcurrencySlots: 2,
          apiSubscriptionTokens: 1000,
          subscriptionGptTokens: 100,
          subscriptionModelTokens: 50,
          subscriptionTokens: 1000,
          user: {
            id: 'user-1',
            username: 'mock-user',
          },
        },
      ],
    });
    return;
  }

  if (req.method === 'POST' && path === '/generations') {
    try {
      const payload = await readJsonBody(req);
      json(res, 200, {
        sdGenerationJob: {
          generationId: payload.prompt ? 'gen-local-1' : 'gen-local-missing-prompt',
          apiCreditCost: 4,
        },
      });
    } catch {
      json(res, 400, { error: 'invalid-json' });
    }
    return;
  }

  if (req.method === 'POST' && path === '/prompt/random') {
    json(res, 200, {
      promptGeneration: {
        apiCreditCost: 4,
        prompt: 'A cinematic portrait lit by neon signs',
      },
    });
    return;
  }

  json(res, 404, { error: 'Not Found', path });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
