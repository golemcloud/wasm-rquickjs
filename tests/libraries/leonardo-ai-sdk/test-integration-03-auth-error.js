import assert from 'assert';
import { Leonardo } from '@leonardo-ai/sdk';

export const run = async () => {
  const client = new Leonardo({
    bearerAuth: 'bad-token',
    serverURL: 'http://localhost:18080',
  });

  let error;
  try {
    await client.user.getUserSelf();
  } catch (caught) {
    error = caught;
  }

  assert.ok(error, 'Expected request with bad token to fail');
  assert.strictEqual(error.name, 'SDKError');
  assert.ok(error.message.includes('Status 401'), `Unexpected error message: ${error.message}`);

  return 'PASS: authentication failures return SDKError against HTTP mock server';
};
