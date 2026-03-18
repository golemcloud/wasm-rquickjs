import assert from 'assert';
import { getJson } from 'serpapi';
import { withMockHttpTransport } from './integration-helpers.js';

export const run = async () =>
  withMockHttpTransport(async () => {
    const json = await getJson({
      engine: 'google',
      api_key: 'test-serpapi-key',
      q: 'serpapi integration',
      hl: 'en',
    });

    assert.strictEqual(json.search_metadata.status, 'Success');
    assert.strictEqual(json.search_parameters.q, 'serpapi integration');
    assert.strictEqual(json.organic_results.length, 2);
    assert.strictEqual(json.organic_results[0].title, 'serpapi integration result 1');

    return 'PASS: getJson performs real HTTP requests against mock SerpAPI endpoint';
  });
