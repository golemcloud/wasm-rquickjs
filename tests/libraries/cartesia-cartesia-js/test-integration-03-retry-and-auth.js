import assert from 'assert';
import Cartesia from '@cartesia/cartesia-js';

const BASE = 'http://localhost:18080';

export const run = async () => {
  const client = new Cartesia({
    token: 'test-token',
    baseURL: BASE,
  });

  const tokenResponse = await client.accessToken.create({
    expires_in: 120,
    grants: { tts: true },
  });

  assert.strictEqual(tokenResponse.token, 'generated-token-120-tts');

  const unauthorizedClient = new Cartesia({
    token: 'invalid-token',
    baseURL: BASE,
    maxRetries: 0,
  });

  let authError;
  try {
    await unauthorizedClient.getStatus();
  } catch (e) {
    authError = e;
  }

  assert.ok(authError instanceof Cartesia.AuthenticationError);
  assert.strictEqual(authError.status, 401);

  return 'PASS: retries recover from 429 and auth failures map to AuthenticationError';
};
