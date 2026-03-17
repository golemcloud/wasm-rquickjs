import http from 'node:http';

const PORT = 18080;

const json = (res, code, payload) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

const server = http.createServer((req, res) => {
  const path = req.url.split('?')[0];
  const key = `${req.method} ${path}`;

  if (key === 'GET /health') {
    return json(res, 200, { status: 'ok' });
  }

  if (key === 'GET /models/mock-model/resolve/main/config.json') {
    return json(res, 200, {
      model_type: 'bert',
      architectures: ['BertModel'],
      hidden_size: 64,
      num_attention_heads: 4,
      num_hidden_layers: 2,
      vocab_size: 30522,
    });
  }

  if (key === 'GET /models/invalid-json/resolve/main/config.json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{invalid-json');
    return;
  }

  return json(res, 404, { error: 'Not Found', method: req.method, path });
});

server.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
