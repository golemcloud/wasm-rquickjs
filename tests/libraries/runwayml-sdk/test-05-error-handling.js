import assert from 'node:assert';
import RunwayML, { AuthenticationError, RateLimitError } from '@runwayml/sdk';

export const run = async () => {
  const authClient = new RunwayML({
    apiKey: 'rk_test_errors',
    baseURL: 'http://localhost:18080',
    maxRetries: 0,
    fetch: async () =>
      new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
  });

  await assert.rejects(
    () => authClient.tasks.retrieve('task-unauthorized'),
    (error) => {
      assert.ok(error instanceof AuthenticationError);
      assert.strictEqual(error.status, 401);
      return true;
    }
  );

  const rateLimitClient = new RunwayML({
    apiKey: 'rk_test_errors',
    baseURL: 'http://localhost:18080',
    maxRetries: 0,
    fetch: async () =>
      new Response(JSON.stringify({ error: 'Too Many Requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }),
  });

  await assert.rejects(
    () => rateLimitClient.tasks.retrieve('task-rate-limit'),
    (error) => {
      assert.ok(error instanceof RateLimitError);
      assert.strictEqual(error.status, 429);
      return true;
    }
  );

  return 'PASS: HTTP status codes map to SDK AuthenticationError and RateLimitError';
};
