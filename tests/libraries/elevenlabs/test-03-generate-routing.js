import assert from 'assert';
import { ElevenLabsClient } from 'elevenlabs';

const DIRECT_VOICE_ID = 'abcdefghijklmnopqrst';

export const run = async () => {
  const client = new ElevenLabsClient({ apiKey: 'test-api-key' });

  const calls = [];
  client.textToSpeech.convert = async (voiceId, request) => {
    calls.push({ method: 'convert', voiceId, request });
    return 'bulk-audio-result';
  };

  client.textToSpeech.convertAsStream = async (voiceId, request) => {
    calls.push({ method: 'convertAsStream', voiceId, request });
    return 'stream-audio-result';
  };

  const bulkRequest = {
    voice: DIRECT_VOICE_ID,
    text: 'Bulk mode',
    model_id: 'eleven_multilingual_v2',
  };
  const streamRequest = {
    voice: DIRECT_VOICE_ID,
    stream: true,
    text: 'Stream mode',
    model_id: 'eleven_multilingual_v2',
  };

  const bulkResult = await client.generate(bulkRequest);
  const streamResult = await client.generate(streamRequest);

  assert.strictEqual(bulkResult, 'bulk-audio-result');
  assert.strictEqual(streamResult, 'stream-audio-result');

  assert.deepStrictEqual(calls, [
    { method: 'convert', voiceId: DIRECT_VOICE_ID, request: bulkRequest },
    { method: 'convertAsStream', voiceId: DIRECT_VOICE_ID, request: streamRequest },
  ]);

  return 'PASS: generate routes direct voice IDs to convert/convertAsStream correctly';
};
