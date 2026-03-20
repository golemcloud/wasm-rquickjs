import assert from 'assert';
import Cartesia from '@cartesia/cartesia-js';

export const run = async () => {
  const client = new Cartesia({
    baseURL: 'http://localhost:18080',
  });

  let error;
  try {
    await client.buildRequest({ method: 'get', path: '/voices' });
  } catch (e) {
    error = e;
  }

  assert.ok(error instanceof Error);
  assert.ok(
    error.message.includes('Could not resolve authentication method'),
    `Unexpected error: ${error?.message}`,
  );

  return 'PASS: missing credentials throw a clear authentication error';
};
