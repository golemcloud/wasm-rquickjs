import assert from 'assert';
import { VoyageAIClient } from 'voyageai';

export const run = async () => {
  const prev = process.env.VOYAGE_API_KEY;
  delete process.env.VOYAGE_API_KEY;

  let missingKeyThrew = false;
  try {
    const clientWithoutKey = new VoyageAIClient({
      fetch: async () => {
        throw new Error('fetch should not be called without credentials');
      },
    });

    await clientWithoutKey.embed({
      input: 'x',
      model: 'voyage-3-large',
    });
  } catch (error) {
    missingKeyThrew = true;
  }

  assert.ok(missingKeyThrew, 'missing API key must throw');

  process.env.VOYAGE_API_KEY = 'env-token';
  let seenAuth = '';

  const envClient = new VoyageAIClient({
    fetch: async (url, init) => {
      const request = typeof url === 'object' && url !== null ? url : undefined;
      const headers = init?.headers || request?.headers;
      if (typeof headers?.get === 'function') {
        seenAuth = headers.get('authorization') || headers.get('Authorization') || '';
      } else {
        seenAuth = headers?.Authorization || headers?.authorization || '';
      }
      return new Response(JSON.stringify({
        object: 'list',
        data: [{ object: 'embedding', embedding: [1], index: 0 }],
        model: 'voyage-3-large',
        usage: { total_tokens: 1 },
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  const result = await envClient.embed({
    input: 'env auth',
    model: 'voyage-3-large',
  });

  assert.strictEqual(result.data[0].embedding[0], 1);
  assert.strictEqual(seenAuth, 'Bearer env-token');

  if (prev === undefined) {
    delete process.env.VOYAGE_API_KEY;
  } else {
    process.env.VOYAGE_API_KEY = prev;
  }

  return 'PASS: validation and env API key fallback work';
};
