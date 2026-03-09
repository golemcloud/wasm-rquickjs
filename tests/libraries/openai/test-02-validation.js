import assert from 'assert';
import OpenAI from 'openai';

export const run = () => {
  const originalApiKey = process.env.OPENAI_API_KEY;

  delete process.env.OPENAI_API_KEY;
  assert.throws(
    () => new OpenAI(),
    (err) => err instanceof Error && err.message.includes('OPENAI_API_KEY')
  );

  process.env.OPENAI_API_KEY = 'env-test-key';
  const envClient = new OpenAI({
    baseURL: 'https://example.com/v1',
    fetch: async () => new Response(JSON.stringify({ object: 'list', data: [] }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    }),
  });
  assert.ok(envClient.models);

  if (originalApiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalApiKey;
  }

  return 'PASS: Constructor enforces missing API key and supports env var fallback';
};
