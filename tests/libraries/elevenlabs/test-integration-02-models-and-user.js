import assert from 'assert';
import { ElevenLabsClient } from 'elevenlabs';

const BASE_URL = 'http://127.0.0.1:18080';

export const run = async () => {
  const client = new ElevenLabsClient({
    apiKey: 'mock-api-key',
    baseUrl: BASE_URL,
  });

  const [models, user, subscription] = await Promise.all([
    client.models.getAll(),
    client.user.get(),
    client.user.getSubscription(),
  ]);

  assert.strictEqual(models.length, 2);
  assert.strictEqual(models[0].model_id, 'eleven_multilingual_v2');

  assert.strictEqual(user.user_id, 'user_mock_123');
  assert.strictEqual(user.is_new_user, false);

  assert.strictEqual(subscription.tier, 'creator');
  assert.strictEqual(subscription.character_limit, 10000);
  assert.strictEqual(subscription.status, 'active');

  return 'PASS: models and user endpoints return expected mocked payloads';
};
