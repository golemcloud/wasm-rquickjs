import assert from 'assert';
import { Ollama } from 'ollama';

export const run = async () => {
  let seenBody = null;

  const mockFetch = async (url, init = {}) => {
    assert.strictEqual(url, 'http://localhost:18080/api/embed');
    assert.strictEqual(init.method, 'POST');
    seenBody = JSON.parse(init.body);

    return new Response(
      JSON.stringify({
        model: 'tinyllm',
        embeddings: [[0.1, 0.2, 0.3]],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  };

  const client = new Ollama({ host: 'http://localhost:18080', fetch: mockFetch });
  const response = await client.embed({
    model: 'tinyllm',
    input: ['hello world'],
    truncate: true,
  });

  assert.strictEqual(seenBody.model, 'tinyllm');
  assert.deepStrictEqual(seenBody.input, ['hello world']);
  assert.strictEqual(seenBody.truncate, true);
  assert.strictEqual(response.model, 'tinyllm');
  assert.strictEqual(response.embeddings.length, 1);
  assert.strictEqual(response.embeddings[0].length, 3);

  return 'PASS: embed() posts JSON and parses embeddings response';
};
