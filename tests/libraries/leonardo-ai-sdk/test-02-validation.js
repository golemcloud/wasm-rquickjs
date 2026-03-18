import assert from 'assert';
import { HTTPClient, Leonardo } from '@leonardo-ai/sdk';

export const run = async () => {
  const seen = [];
  const httpClient = new HTTPClient({
    fetcher: async (request) => {
      seen.push({
        url: request.url,
        method: request.method,
        authorization: request.headers.get('authorization'),
      });
      return new Response(
        JSON.stringify({
          user_details: [
            {
              user: { id: 'user-1', username: 'tester' },
            },
          ],
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    },
  });

  const client = new Leonardo({
    bearerAuth: async () => 'dynamic-token',
    serverURL: 'http://localhost:18080',
    httpClient,
  });

  const response = await client.user.getUserSelf();

  assert.strictEqual(seen.length, 1);
  assert.strictEqual(seen[0].method, 'GET');
  assert.strictEqual(seen[0].url, 'http://localhost:18080/me');
  assert.strictEqual(seen[0].authorization, 'Bearer dynamic-token');
  assert.strictEqual(response.object.userDetails[0].user.id, 'user-1');

  return 'PASS: async bearer auth resolves and attaches Authorization header';
};
