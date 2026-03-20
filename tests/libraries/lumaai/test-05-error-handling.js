import assert from 'assert';
import 'lumaai/shims/web';
import LumaAI, { AuthenticationError } from 'lumaai';

export const run = async () => {
  const client = new LumaAI({
    authToken: 'invalid-token',
    baseURL: 'http://localhost:18080/dream-machine/v1',
    fetch: async () =>
      new Response(
        JSON.stringify({
          message: 'Unauthorized',
        }),
        {
          status: 401,
          headers: { 'content-type': 'application/json' },
        },
      ),
  });

  try {
    await client.credits.get();
    throw new Error('Expected credits.get to throw an authentication error');
  } catch (error) {
    assert.ok(error instanceof Error);
    assert.ok(error instanceof AuthenticationError, `Unexpected error type: ${error.name}`);
    assert.strictEqual(error.status, 401);
  }

  return 'PASS: 401 responses map to AuthenticationError';
};
