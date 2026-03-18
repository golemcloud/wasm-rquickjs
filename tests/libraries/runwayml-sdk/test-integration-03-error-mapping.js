import assert from 'node:assert';
import RunwayML, { AuthenticationError } from '@runwayml/sdk';

const BASE = 'http://localhost:18080';

export const run = async () => {
  const client = new RunwayML({
    apiKey: 'rk_test_integration',
    baseURL: BASE,
    maxRetries: 0,
  });

  await assert.rejects(
    () => client.tasks.retrieve('task-unauthorized'),
    (error) => {
      assert.ok(error instanceof AuthenticationError);
      assert.strictEqual(error.status, 401);
      return true;
    }
  );

  return 'PASS: HTTP 401 from mock server maps to AuthenticationError';
};
