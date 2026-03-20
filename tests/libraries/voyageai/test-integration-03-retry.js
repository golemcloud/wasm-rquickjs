import assert from 'assert';
import { VoyageAIClient } from 'voyageai';

const BASE_URL = 'http://localhost:18080/v1';

export const run = async () => {
  const client = new VoyageAIClient({
    apiKey: 'integration-key',
    baseUrl: BASE_URL,
    maxRetries: 1,
  });

  const result = await client.embed({
    input: 'retry-me',
    model: 'voyage-3-large',
  });

  assert.strictEqual(result.data[0].index, 0);
  assert.deepStrictEqual(result.data[0].embedding, [0.5, 0.25, 0.125]);
  return 'PASS: retry logic recovers from one 429 response';
};
