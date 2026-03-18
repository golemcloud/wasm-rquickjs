import assert from 'assert';
import { HTTPClient, Leonardo } from '@leonardo-ai/sdk';

export const run = async () => {
  const seen = [];
  const httpClient = new HTTPClient({
    fetcher: async (request) => {
      seen.push({
        url: request.url,
        method: request.method,
      });

      return new Response(
        JSON.stringify({
          promptGeneration: {
            apiCreditCost: 4,
            prompt: 'A neon city skyline in the rain',
          },
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    },
  });

  const client = new Leonardo({
    bearerAuth: 'prompt-token',
    serverURL: 'http://localhost:18080',
    httpClient,
  });

  const response = await client.prompt.promptRandom();

  assert.strictEqual(seen.length, 1);
  assert.strictEqual(seen[0].method, 'POST');
  assert.strictEqual(seen[0].url, 'http://localhost:18080/prompt/random');
  assert.strictEqual(response.object.promptGeneration.prompt, 'A neon city skyline in the rain');

  return 'PASS: promptRandom sends POST and parses promptGeneration output';
};
