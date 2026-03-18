import assert from 'assert';
import Cartesia from '@cartesia/cartesia-js';

export const run = async () => {
  const client = new Cartesia({
    apiKey: 'test-api-key',
    baseURL: 'http://localhost:18080',
  });

  const built = await client.buildRequest({
    method: 'post',
    path: '/access-token',
    body: {
      expires_in: 120,
      grants: { tts: true },
    },
  });

  const headers = new Headers(built.req.headers);
  assert.strictEqual(headers.get('authorization'), 'Bearer test-api-key');
  assert.strictEqual(headers.get('content-type'), 'application/json');
  assert.ok(typeof built.req.body === 'string');
  assert.ok(built.req.body.includes('"expires_in":120'));
  assert.ok(built.req.body.includes('"tts":true'));

  return 'PASS: buildRequest serializes JSON body with apiKey auth';
};
