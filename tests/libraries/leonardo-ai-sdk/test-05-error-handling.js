import assert from 'assert';
import { HTTPClient, Leonardo } from '@leonardo-ai/sdk';

export const run = async () => {
  const httpClient = new HTTPClient({
    fetcher: async () =>
      new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
  });

  const client = new Leonardo({
    bearerAuth: 'bad-token',
    serverURL: 'http://localhost:18080',
    httpClient,
  });

  let error;
  try {
    await client.user.getUserSelf();
  } catch (caught) {
    error = caught;
  }

  assert.ok(error, 'Expected SDK to throw on 401 response');
  assert.strictEqual(error.name, 'SDKError');
  assert.ok(error.message.includes('Status 401'), `Unexpected error message: ${error.message}`);

  return 'PASS: non-200 responses surface as SDKError with HTTP status context';
};
