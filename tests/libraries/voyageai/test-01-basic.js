import assert from 'assert';
import { VoyageAIClient } from 'voyageai';

export const run = async () => {
  let seenUrl = '';
  let seenAuth = '';
  let seenBody;

  const client = new VoyageAIClient({
    apiKey: 'test-key',
    fetch: async (url, init) => {
      const request = typeof url === 'object' && url !== null ? url : undefined;
      seenUrl = request?.url || String(url);

      const headers = init?.headers || request?.headers;
      if (typeof headers?.get === 'function') {
        seenAuth = headers.get('authorization') || headers.get('Authorization') || '';
      } else {
        seenAuth = headers?.Authorization || headers?.authorization || '';
      }

      const bodyText = typeof init?.body === 'string'
        ? init.body
        : (typeof request?.clone === 'function' ? await request.clone().text() : '');
      seenBody = bodyText ? JSON.parse(bodyText) : {};
      return new Response(JSON.stringify({
        object: 'list',
        data: [{ object: 'embedding', embedding: [0.1, 0.2, 0.3], index: 0 }],
        model: 'voyage-3-large',
        usage: { total_tokens: 7 },
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  const result = await client.embed({
    input: 'hello voyage',
    model: 'voyage-3-large',
    inputType: 'query',
  });

  assert.ok(seenUrl.includes('/embeddings'));
  assert.strictEqual(seenAuth, 'Bearer test-key');
  assert.strictEqual(seenBody.model, 'voyage-3-large');
  assert.ok(seenBody.input_type === 'query' || seenBody.inputType === 'query');
  assert.strictEqual(result.data[0].index, 0);
  assert.deepStrictEqual(result.data[0].embedding, [0.1, 0.2, 0.3]);
  assert.strictEqual(result.model, 'voyage-3-large');

  return 'PASS: embed() basic request/response flow works';
};
