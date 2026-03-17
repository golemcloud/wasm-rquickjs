import assert from 'assert';
import { HTTPClient, Mistral } from '@mistralai/mistralai';

export const run = async () => {
  const originalApiKey = process.env.MISTRAL_API_KEY;
  const calls = [];

  try {
    process.env.MISTRAL_API_KEY = 'env-mistral-key';

    const httpClient = new HTTPClient({
      fetcher: async (input, init) => {
        const request = input instanceof Request ? input : new Request(input, init);
        calls.push({
          url: request.url,
          method: request.method,
          authorization: request.headers.get('authorization'),
          body: await request.text(),
        });

        const mockedEmbeddingResponse = {
          id: 'embd_123',
          object: 'list',
          model: 'mistral-embed',
          data: [{ object: 'embedding', index: 0, embedding: [0.25, 0.5, 0.75] }],
          usage: { prompt_tokens: 3, total_tokens: 3 },
        };

        return new Response(JSON.stringify(mockedEmbeddingResponse), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      },
    });

    const client = new Mistral({
      httpClient,
      serverURL: 'https://example.invalid',
    });

    const response = await client.embeddings.create({
      model: 'mistral-embed',
      inputs: ['alpha'],
      encodingFormat: 'float',
    });

    assert.strictEqual(response.id, 'embd_123');
    assert.strictEqual(response.model, 'mistral-embed');
    assert.deepStrictEqual(response.data[0].embedding, [0.25, 0.5, 0.75]);

    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].url, 'https://example.invalid/v1/embeddings');
    assert.strictEqual(calls[0].method, 'POST');
    assert.strictEqual(calls[0].authorization, 'Bearer env-mistral-key');

    const body = JSON.parse(calls[0].body);
    assert.strictEqual(body.model, 'mistral-embed');
    assert.deepStrictEqual(body.input, ['alpha']);
    assert.strictEqual(body.encoding_format, 'float');

    return 'PASS: embeddings.create() respects env API key fallback and serverURL override';
  } finally {
    if (originalApiKey === undefined) {
      delete process.env.MISTRAL_API_KEY;
    } else {
      process.env.MISTRAL_API_KEY = originalApiKey;
    }
  }
};
