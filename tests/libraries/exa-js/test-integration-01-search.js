import assert from 'assert';
import Exa from 'exa-js';

export const run = async () => {
  const exa = new Exa('test-api-key', 'http://localhost:18080');

  const response = await exa.search('deterministic query', { numResults: 1 });
  assert.strictEqual(response.results.length, 1);
  assert.strictEqual(response.results[0].title, 'Example Result');
  assert.strictEqual(response.autopromptString, 'deterministic query');

  return 'PASS: search() performs HTTP request and parses JSON response';
};
