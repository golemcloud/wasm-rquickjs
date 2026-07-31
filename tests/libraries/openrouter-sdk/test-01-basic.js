import assert from 'node:assert';
import { HTTPClient, OpenRouter } from '@openrouter/sdk';

export const run = () => {
  const httpClient = new HTTPClient();
  const client = new OpenRouter({
    apiKey: 'sk-test',
    httpClient,
  });

  assert.ok(client.chat);
  assert.strictEqual(typeof client.chat.send, 'function');
  assert.strictEqual(typeof httpClient.request, 'function');

  return 'PASS: OpenRouter client exposes the chat and HTTP client APIs';
};
