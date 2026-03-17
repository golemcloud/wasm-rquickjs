import assert from 'assert';
import { VoyageAIClient } from 'voyageai';

const BASE_URL = 'http://localhost:18080/v1';

export const run = async () => {
  const client = new VoyageAIClient({
    apiKey: 'integration-key',
    baseUrl: BASE_URL,
  });

  const result = await client.embed({
    input: 'integration embedding test',
    model: 'voyage-3-large',
  });

  assert.strictEqual(result.model, 'voyage-3-large');
  assert.strictEqual(result.data.length, 1);
  assert.deepStrictEqual(result.data[0].embedding, [0.5, 0.25, 0.125]);
  return 'PASS: embed() works against local mock HTTP server';
};
