import assert from 'assert';
import {
  ElevenLabsClient,
  ElevenLabsEnvironment,
  ElevenLabsError,
  ElevenLabsTimeoutError,
} from 'elevenlabs';

export const run = () => {
  const client = new ElevenLabsClient({ apiKey: 'test-api-key' });

  assert.ok(client.voices, 'voices namespace should be available');
  assert.ok(client.models, 'models namespace should be available');
  assert.ok(client.user, 'user namespace should be available');
  assert.ok(client.textToSpeech, 'textToSpeech namespace should be available');

  assert.strictEqual(ElevenLabsEnvironment.Production.base, 'https://api.elevenlabs.io');
  assert.strictEqual(ElevenLabsEnvironment.Production.wss, 'wss://api.elevenlabs.io');
  assert.ok(ElevenLabsError.prototype instanceof Error);
  assert.ok(ElevenLabsTimeoutError.prototype instanceof Error);

  return 'PASS: client initialization and core exports work';
};
