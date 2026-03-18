import assert from 'assert';
import { DeepgramClient } from '@deepgram/sdk';

const BASE = 'http://localhost:18080';

export const run = async () => {
  const client = new DeepgramClient({
    apiKey: 'mock-api-key',
    baseUrl: BASE,
  });

  const tokenResponse = await client.auth.v1.tokens.grant();
  assert.strictEqual(tokenResponse.access_token, 'mock-access-token');
  assert.strictEqual(tokenResponse.expires_in, 30);

  const models = await client.manage.v1.models.list();
  assert.ok(Array.isArray(models));
  assert.strictEqual(models[0].model_uuid, 'model-1');

  return 'PASS: auth token grant and manage models list over HTTP';
};
