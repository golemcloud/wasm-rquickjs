import assert from 'assert';
import Groq from 'groq-sdk';

export const run = () => {
  const previousApiKey = process.env.GROQ_API_KEY;
  try {
    delete process.env.GROQ_API_KEY;

    assert.throws(
      () => new Groq({}),
      (error) => error instanceof Error && error.message.includes('GROQ_API_KEY'),
    );
  } finally {
    if (previousApiKey === undefined) {
      delete process.env.GROQ_API_KEY;
    } else {
      process.env.GROQ_API_KEY = previousApiKey;
    }
  }

  const client = new Groq({ apiKey: 'test-api-key', timeout: 60000, maxRetries: 2 });
  const derived = client.withOptions({ timeout: 1234, defaultQuery: { trace: '1' } });

  assert.notStrictEqual(derived, client);
  assert.strictEqual(client.timeout, 60000);
  assert.strictEqual(derived.timeout, 1234);
  assert.strictEqual(derived.buildURL('/openai/v1/models'), 'https://api.groq.com/openai/v1/models?trace=1');

  return 'PASS: Groq validates missing API key and withOptions creates derived clients';
};
