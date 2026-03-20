import assert from 'assert';
import { algoliasearch } from 'algoliasearch';

const createErrorRequester = () => ({
  async send(endRequest) {
    const url = new URL(endRequest.url);
    const path = url.pathname;

    if (endRequest.method === 'GET' && path.endsWith('/settings')) {
      return {
        status: 404,
        isTimedOut: false,
        content: JSON.stringify({ message: 'Index does not exist' }),
      };
    }

    if (endRequest.method === 'GET' && path === '/1/indexes/products/missing-object') {
      return {
        status: 404,
        isTimedOut: false,
        content: JSON.stringify({ message: 'Object not found' }),
      };
    }

    return {
      status: 200,
      isTimedOut: false,
      content: JSON.stringify({ ok: true }),
    };
  },
});

export const run = async () => {
  const client = algoliasearch('APP_ID', 'API_KEY', {
    requester: createErrorRequester(),
  });

  const exists = await client.indexExists({ indexName: 'products' });
  assert.strictEqual(exists, false);

  let thrown;
  try {
    await client.getObject({ indexName: 'products', objectID: 'missing-object' });
  } catch (error) {
    thrown = error;
  }

  assert.ok(thrown, 'Expected getObject to throw');
  assert.strictEqual(thrown.name, 'ApiError');
  assert.strictEqual(thrown.status, 404);

  return 'PASS: API errors propagate and indexExists handles 404';
};
