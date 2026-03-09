import assert from 'assert';
import Anthropic from '@anthropic-ai/sdk';

export const run = () => {
  const client = new Anthropic({
    apiKey: 'test-anthropic-api-key',
    baseURL: 'https://example.com',
  });

  assert.ok(client.messages, 'messages resource should exist');
  assert.ok(client.models, 'models resource should exist');
  assert.strictEqual(Anthropic.HUMAN_PROMPT, '\\n\\nHuman:');
  assert.strictEqual(Anthropic.AI_PROMPT, '\\n\\nAssistant:');
  assert.strictEqual(Anthropic.DEFAULT_TIMEOUT, 600000);

  const tuned = client.withOptions({ timeout: 1234, maxRetries: 0 });
  assert.notStrictEqual(tuned, client);
  assert.strictEqual(tuned.timeout, 1234);
  assert.strictEqual(tuned.maxRetries, 0);

  return 'PASS: Anthropic client constructs with core resources and withOptions clone';
};
