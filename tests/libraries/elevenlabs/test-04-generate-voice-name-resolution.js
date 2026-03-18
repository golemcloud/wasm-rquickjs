import assert from 'assert';
import { ElevenLabsClient, ElevenLabsError } from 'elevenlabs';

const RESOLVED_VOICE_ID = 'ABCDEFGHIJKLMNOPQRST';

export const run = async () => {
  const client = new ElevenLabsClient({ apiKey: 'test-api-key' });

  const calls = {
    getAllArgs: [],
    convertCalls: [],
  };

  client.voices.getAll = async (request) => {
    calls.getAllArgs.push(request);
    return {
      voices: [
        { voice_id: RESOLVED_VOICE_ID, name: 'Sarah' },
        { voice_id: 'QRSTUVWXYZABCDEFGHIK', name: 'Matilda' },
      ],
    };
  };

  client.textToSpeech.convert = async (voiceId, request) => {
    calls.convertCalls.push({ voiceId, request });
    return 'resolved-audio-result';
  };

  const result = await client.generate({
    voice: 'Sarah',
    text: 'Resolve by voice name',
    model_id: 'eleven_multilingual_v2',
  });

  assert.strictEqual(result, 'resolved-audio-result');
  assert.deepStrictEqual(calls.getAllArgs, [{ show_legacy: true }]);
  assert.deepStrictEqual(calls.convertCalls, [
    {
      voiceId: RESOLVED_VOICE_ID,
      request: {
        voice: 'Sarah',
        text: 'Resolve by voice name',
        model_id: 'eleven_multilingual_v2',
      },
    },
  ]);

  await assert.rejects(
    () =>
      client.generate({
        voice: 'Unknown Voice',
        text: 'Should fail',
        model_id: 'eleven_multilingual_v2',
      }),
    (error) => {
      assert.ok(error instanceof ElevenLabsError, 'should throw ElevenLabsError for unknown voice name');
      assert.match(error.message, /Unknown Voice is not a valid voice name/);
      return true;
    }
  );

  return 'PASS: generate resolves voice names and rejects unknown voice names';
};
