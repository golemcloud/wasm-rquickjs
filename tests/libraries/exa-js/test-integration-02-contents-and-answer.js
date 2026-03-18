import assert from 'assert';
import Exa from 'exa-js';

export const run = async () => {
  const exa = new Exa('test-api-key', 'http://localhost:18080');

  const contents = await exa.getContents(['https://example.com/a', 'https://example.com/b'], {
    text: { maxCharacters: 256 },
  });
  assert.strictEqual(contents.results.length, 2);
  assert.match(contents.results[0].text, /Fetched content/);

  const answer = await exa.answer('What is this?', { text: true });
  assert.strictEqual(answer.answer, 'Deterministic mock answer');
  assert.strictEqual(answer.citations.length, 1);

  return 'PASS: getContents() and answer() parse mock API responses';
};
