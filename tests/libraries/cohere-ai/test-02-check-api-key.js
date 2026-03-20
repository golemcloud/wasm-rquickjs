import assert from 'assert';
import { CohereClient } from 'cohere-ai';

export const run = async () => {
  const calls = [];

  const client = new CohereClient({
    token: 'test-token',
    fetch: async (url, init = {}) => {
      const headers = new Headers(init.headers);
      calls.push({
        url: String(url),
        method: init.method,
        authorization: headers.get('authorization'),
      });

      return new Response(JSON.stringify({
        valid: true,
        organization_id: 'org_123',
        owner_id: 'owner_456',
      }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-test': 'cohere-check-api-key',
        },
      });
    },
  });

  const { data, rawResponse } = await client.checkApiKey().withRawResponse();

  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].method, 'POST');
  assert.ok(calls[0].url.endsWith('/v1/check-api-key'));
  assert.strictEqual(calls[0].authorization, 'Bearer test-token');

  assert.strictEqual(data.valid, true);
  assert.strictEqual(data.organizationId, 'org_123');
  assert.strictEqual(data.ownerId, 'owner_456');
  assert.strictEqual(rawResponse.headers.get('x-test'), 'cohere-check-api-key');

  return 'PASS: checkApiKey() serializes auth headers and supports withRawResponse()';
};
