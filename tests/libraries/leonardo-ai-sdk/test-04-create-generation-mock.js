import assert from 'assert';
import { HTTPClient, Leonardo } from '@leonardo-ai/sdk';

export const run = async () => {
  const seen = [];
  const httpClient = new HTTPClient({
    fetcher: async (request) => {
      seen.push({
        url: request.url,
        method: request.method,
        body: await request.text(),
      });

      return new Response(
        JSON.stringify({
          sdGenerationJob: {
            generationId: 'gen-123',
            apiCreditCost: 4,
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
    bearerAuth: 'generation-token',
    serverURL: 'http://localhost:18080',
    httpClient,
  });

  const response = await client.image.createGeneration({
    prompt: 'A castle on a hill at sunrise',
    width: 640,
    height: 640,
    numImages: 1,
  });

  assert.strictEqual(seen.length, 1);
  assert.strictEqual(seen[0].method, 'POST');
  assert.strictEqual(seen[0].url, 'http://localhost:18080/generations');

  const payload = JSON.parse(seen[0].body);
  assert.strictEqual(payload.prompt, 'A castle on a hill at sunrise');
  assert.strictEqual(payload.width, 640);
  assert.strictEqual(payload.height, 640);
  assert.strictEqual(payload.num_images, 1);
  assert.ok(Object.prototype.hasOwnProperty.call(payload, 'modelId'));

  assert.strictEqual(response.object.sdGenerationJob.generationId, 'gen-123');

  return 'PASS: createGeneration serializes request body and parses generationId';
};
