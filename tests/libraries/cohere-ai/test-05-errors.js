import assert from 'assert';
import { CohereClient, CohereError, CohereTimeoutError } from 'cohere-ai';

export const run = async () => {
  const client = new CohereClient({
    token: 'test-token',
    fetch: async () => {
      return new Response(JSON.stringify({
        message: 'invalid credentials',
        detail: 'mock auth failure',
      }), {
        status: 401,
        headers: {
          'content-type': 'application/json',
        },
      });
    },
  });

  let caught;
  try {
    await client.checkApiKey();
  } catch (error) {
    caught = error;
  }

  assert.ok(caught instanceof CohereError);
  assert.strictEqual(caught.statusCode, 401);
  assert.deepStrictEqual(caught.body, {
    message: 'invalid credentials',
    detail: 'mock auth failure',
  });
  assert.ok(caught.message.includes('Status code: 401'));

  const timeoutError = new CohereTimeoutError('request timed out');
  assert.ok(timeoutError instanceof Error);
  assert.ok(timeoutError instanceof CohereTimeoutError);
  assert.strictEqual(timeoutError.message, 'request timed out');

  return 'PASS: HTTP failures surface as CohereError and timeout errors keep their message';
};
