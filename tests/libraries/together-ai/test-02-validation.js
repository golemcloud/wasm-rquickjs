import assert from 'assert';
import Together from 'together-ai';

export const run = () => {
  const previousApiKey = process.env.TOGETHER_API_KEY;
  delete process.env.TOGETHER_API_KEY;

  let threw = false;
  try {
    new Together({ apiKey: undefined });
  } catch (error) {
    threw = true;
    assert.ok(error instanceof Error);
    assert.ok(error.message.includes('TOGETHER_API_KEY'));
  } finally {
    if (previousApiKey === undefined) {
      delete process.env.TOGETHER_API_KEY;
    } else {
      process.env.TOGETHER_API_KEY = previousApiKey;
    }
  }

  assert.strictEqual(threw, true);

  const client = new Together({
    apiKey: 'test-api-key',
    timeout: 1200,
    maxRetries: 0,
    defaultQuery: { a: '1' },
  });

  const derived = client.withOptions({ timeout: 3000, maxRetries: 1 });

  assert.notStrictEqual(derived, client);
  assert.strictEqual(client.timeout, 1200);
  assert.strictEqual(derived.timeout, 3000);
  assert.strictEqual(client.maxRetries, 0);
  assert.strictEqual(derived.maxRetries, 1);
  assert.strictEqual(derived.buildURL('/models'), client.buildURL('/models'));

  return 'PASS: Validation and withOptions cloning behave as expected';
};
