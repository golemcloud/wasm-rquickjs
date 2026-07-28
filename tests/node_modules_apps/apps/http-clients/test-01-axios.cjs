const assert = require('node:assert');
const axios = require('axios');

exports.run = async () => {
  const client = axios.create({
    adapter: async (config) => ({
      data: { ok: true, url: config.url, header: config.headers.get('x-test') },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      request: {},
    }),
  });
  client.interceptors.request.use((config) => {
    config.headers.set('x-test', 'installed-app');
    return config;
  });
  const response = await client.get('https://example.invalid/api');
  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(response.data, { ok: true, url: 'https://example.invalid/api', header: 'installed-app' });
  return 'PASS: axios loads from node_modules and custom adapter/interceptors work';
};
