import assert from 'assert';
import { getJson } from 'serpapi';
import { resetConfig, withMockHttpsGet } from './helpers.js';

export const run = async () => {
  resetConfig();

  const payload = {
    search_metadata: { id: 'search-basic-1', status: 'Success' },
    search_parameters: { q: 'coffee beans', engine: 'google' },
    organic_results: [{ position: 1, title: 'Coffee Beans Guide' }],
  };

  const result = await withMockHttpsGet(
    { statusCode: 200, body: JSON.stringify(payload) },
    async (calls) => {
      const json = await getJson({
        engine: 'google',
        api_key: 'test-key',
        q: 'coffee beans',
        hl: 'en',
      });

      assert.strictEqual(calls.length, 1);
      const req = calls[0];
      assert.strictEqual(req.hostname, 'serpapi.com');
      assert.strictEqual(req.port, 443);
      assert.strictEqual(req.method, 'GET');
      assert.ok(req.path.startsWith('/search?'));
      assert.ok(req.path.includes('engine=google'));
      assert.ok(req.path.includes('api_key=test-key'));
      assert.ok(req.path.includes('output=json'));
      assert.ok(req.path.includes('q=coffee%20beans'));
      assert.ok(!req.path.includes('timeout='));
      assert.ok(!req.path.includes('requestOptions='));
      return json;
    },
  );

  assert.strictEqual(result.search_metadata.id, 'search-basic-1');
  assert.strictEqual(result.search_parameters.q, 'coffee beans');
  assert.strictEqual(result.organic_results[0].title, 'Coffee Beans Guide');

  resetConfig();
  return 'PASS: getJson builds expected request and parses JSON response';
};
