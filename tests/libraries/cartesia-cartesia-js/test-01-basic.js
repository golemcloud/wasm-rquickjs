import assert from 'assert';
import Cartesia from '@cartesia/cartesia-js';

export const run = () => {
  const client = new Cartesia({
    token: 'test-token',
    baseURL: 'http://localhost:18080',
  });

  assert.ok(client.tts);
  assert.ok(client.voices);
  assert.ok(client.accessToken);

  const url = client.buildURL('/voices', { limit: 2, expand: ['preview_file_url'] });
  assert.strictEqual(url, 'http://localhost:18080/voices?limit=2&expand%5B%5D=preview_file_url');

  return 'PASS: Cartesia client constructs and builds URLs';
};
