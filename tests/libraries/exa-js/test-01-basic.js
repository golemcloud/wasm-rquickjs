import assert from 'assert';
import Exa from 'exa-js';

export const run = () => {
  const exa = new Exa('test-api-key', 'http://localhost:18080');

  assert.strictEqual(typeof exa.search, 'function');
  assert.strictEqual(typeof exa.findSimilar, 'function');
  assert.strictEqual(typeof exa.getContents, 'function');
  assert.strictEqual(typeof exa.answer, 'function');
  assert.strictEqual(typeof exa.streamAnswer, 'function');

  assert.ok(exa.websets);
  assert.ok(exa.research);
  assert.strictEqual(typeof exa.websets.waitUntilIdle, 'function');
  assert.strictEqual(typeof exa.research.pollUntilFinished, 'function');

  return 'PASS: Exa client exposes core APIs and sub-clients';
};
