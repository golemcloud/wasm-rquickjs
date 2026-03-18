import assert from 'assert';
import Exa from 'exa-js';

export const run = async () => {
  const exa = new Exa('test-api-key', 'http://localhost:18080');

  const chunks = [];
  const citationIds = [];

  for await (const chunk of exa.streamAnswer('stream please')) {
    if (chunk.content) {
      chunks.push(chunk.content);
    }
    if (chunk.citations) {
      citationIds.push(...chunk.citations.map((c) => c.id));
    }
  }

  assert.strictEqual(chunks.join(''), 'Hello world');
  assert.deepStrictEqual(citationIds, ['cit-1']);

  return 'PASS: streamAnswer() parses SSE chunks and citations';
};
