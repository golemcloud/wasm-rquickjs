import assert from 'assert';
import OpenAI from 'openai';

export const run = () => {
  const client = new OpenAI({
    apiKey: 'test-api-key',
    baseURL: 'https://example.com/v1',
    fetch: async () => new Response(JSON.stringify({ object: 'list', data: [] }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'x-request-id': 'req_basic',
      },
    }),
  });

  assert.ok(client.models);
  assert.ok(client.responses);
  assert.ok(client.chat);

  const tunedClient = client.withOptions({ timeout: 1234 });
  assert.notStrictEqual(tunedClient, client);
  assert.ok(tunedClient.models);

  return 'PASS: OpenAI client constructs with core resources and withOptions clone';
};
