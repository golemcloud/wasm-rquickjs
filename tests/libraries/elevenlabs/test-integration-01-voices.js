import assert from 'assert';
import { ElevenLabsClient } from 'elevenlabs';

const BASE_URL = 'http://127.0.0.1:18080';

export const run = async () => {
  const client = new ElevenLabsClient({
    apiKey: 'mock-api-key',
    baseUrl: BASE_URL,
  });

  const response = await client.voices.getAll({ show_legacy: true });

  assert.strictEqual(response.voices.length, 2);
  assert.strictEqual(response.voices[0].voice_id, 'voice_1');
  assert.strictEqual(response.voices[0].name, 'Mock Voice One');
  assert.strictEqual(response.voices[1].voice_id, 'voice_2');

  return 'PASS: voices.getAll returns mocked voices over HTTP';
};
