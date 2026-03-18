import http from 'node:http';

const PORT = 18080;

const pod = ({ ip, host, ready, initialized, phase = 'Running' }) => ({
  status: {
    phase,
    conditions: [
      {
        type: 'Initialized',
        status: initialized ? 'True' : 'False',
        lastTransitionTime: '2026-03-18T00:00:00Z',
      },
      {
        type: 'Ready',
        status: ready ? 'True' : 'False',
        lastTransitionTime: ready ? '2026-03-18T00:00:05Z' : '2026-03-18T00:00:00Z',
      },
    ],
    podIP: ip,
    hostIP: host,
  },
});

const podsDefault = [
  pod({ ip: '10.0.0.10', host: '192.168.1.10', ready: true, initialized: true }),
  pod({ ip: '10.0.0.11', host: '192.168.1.11', ready: false, initialized: true }),
];

const podsPayments = [
  pod({ ip: '10.1.0.7', host: '192.168.2.7', ready: true, initialized: true }),
];

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    json(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/api/v1/pods' || url.pathname === '/api/v1/namespaces/payments/pods')) {
    const fieldSelector = url.searchParams.get('fieldSelector');
    const labelSelector = url.searchParams.get('labelSelector');

    if (fieldSelector !== 'status.phase=Running') {
      json(res, 400, { error: 'missing expected fieldSelector=status.phase=Running' });
      return;
    }

    if (labelSelector === 'app=error') {
      json(res, 500, { error: 'forced server error' });
      return;
    }

    if (url.pathname === '/api/v1/namespaces/payments/pods' && labelSelector === 'app=payments') {
      json(res, 200, { items: podsPayments });
      return;
    }

    if (url.pathname === '/api/v1/pods') {
      json(res, 200, { items: podsDefault });
      return;
    }

    json(res, 200, { items: [] });
    return;
  }

  json(res, 404, { error: 'Not Found', method: req.method, path: url.pathname });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
