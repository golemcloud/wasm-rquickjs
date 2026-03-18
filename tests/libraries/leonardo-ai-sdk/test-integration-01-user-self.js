import assert from 'assert';
import { Leonardo } from '@leonardo-ai/sdk';

export const run = async () => {
  const client = new Leonardo({
    bearerAuth: 'integration-token',
    serverURL: 'http://localhost:18080',
  });

  const response = await client.user.getUserSelf();

  assert.strictEqual(response.statusCode, 200);
  assert.strictEqual(response.object.userDetails[0].user.username, 'mock-user');
  return 'PASS: user.getUserSelf() works against HTTP mock server';
};
