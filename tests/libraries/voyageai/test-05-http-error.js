import assert from 'assert';
import { VoyageAIClient, VoyageAIError } from 'voyageai';

export const run = async () => {
  const client = new VoyageAIClient({
    apiKey: 'test-key',
    fetch: async () => new Response(JSON.stringify({
      detail: 'invalid api key',
      code: 'auth_failed',
    }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    }),
  });

  let threw = false;
  try {
    await client.embed({
      input: 'should fail',
      model: 'voyage-3-large',
    });
  } catch (error) {
    threw = true;
    assert.ok(error instanceof VoyageAIError || String(error?.message || error).includes('401'));
    if (error instanceof VoyageAIError) {
      assert.strictEqual(error.statusCode, 401);
      assert.ok(String(error.message).toLowerCase().includes('api key') || String(error.message).toLowerCase().includes('invalid'));
    }
  }

  assert.ok(threw, 'HTTP 401 should throw');
  return 'PASS: HTTP error responses map to VoyageAIError';
};
