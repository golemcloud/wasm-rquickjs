import assert from 'assert';
import { Mistral, ServerEu, ServerList } from '@mistralai/mistralai';

export const run = () => {
  const client = new Mistral({ apiKey: 'test-api-key' });

  assert.strictEqual(ServerEu, 'eu');
  assert.strictEqual(ServerList.eu, 'https://api.mistral.ai');
  assert.strictEqual(client._baseURL.toString(), 'https://api.mistral.ai/');

  assert.ok(client.chat);
  assert.ok(client.embeddings);
  assert.ok(client.models);

  assert.strictEqual(client.chat, client.chat);
  assert.strictEqual(client.embeddings, client.embeddings);
  assert.strictEqual(client.models, client.models);

  return 'PASS: Mistral client initializes core namespaces and default server metadata';
};
