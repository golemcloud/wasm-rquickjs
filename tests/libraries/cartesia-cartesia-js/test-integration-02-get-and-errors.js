import assert from 'assert';
import Cartesia from '@cartesia/cartesia-js';

const BASE = 'http://localhost:18080';

export const run = async () => {
  const client = new Cartesia({
    token: 'test-token',
    baseURL: BASE,
  });

  const { data, response } = await client.voices.get('voice-1').withResponse();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.headers.get('x-mock-route'), 'voices-get');
  assert.strictEqual(data.id, 'voice-1');
  assert.strictEqual(data.name, 'Ada');

  let notFoundError;
  try {
    await client.voices.get('missing');
  } catch (e) {
    notFoundError = e;
  }

  assert.ok(notFoundError instanceof Cartesia.NotFoundError);
  assert.strictEqual(notFoundError.status, 404);

  return 'PASS: voices.get returns data and maps 404 to NotFoundError';
};
