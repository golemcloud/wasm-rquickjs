import assert from 'assert';
import { ElevenLabsClient, ElevenLabsError } from 'elevenlabs';

const BASE_URL = 'http://127.0.0.1:18080';

export const run = async () => {
  const client = new ElevenLabsClient({
    apiKey: 'mock-api-key',
    baseUrl: BASE_URL,
  });

  const tts = await client.textToSpeech.convertWithTimestamps('voice_1', {
    text: 'Hello mock world',
    model_id: 'eleven_multilingual_v2',
  });

  assert.strictEqual(tts.audio_base64, 'U09NRV9NT0NLX0FVRElP');
  assert.deepStrictEqual(tts.alignment.characters, ['H', 'i']);
  assert.deepStrictEqual(tts.alignment.character_start_times_seconds, [0, 0.2]);

  await assert.rejects(
    () => client.voices.get('missing-voice'),
    (error) => {
      assert.ok(error instanceof ElevenLabsError, '404 should surface as ElevenLabsError');
      assert.strictEqual(error.statusCode, 404);
      assert.deepStrictEqual(error.body, { detail: 'Voice not found' });
      return true;
    }
  );

  return 'PASS: text-to-speech timestamps and HTTP error mapping work with mock server';
};
