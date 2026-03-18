import assert from 'assert';
import { TextToSpeechClient } from '@google-cloud/text-to-speech/build/src/v1/index.js';
import { fallback as fallbackGax } from 'google-gax';

if (!fallbackGax.loggingUtils) {
  fallbackGax.loggingUtils = {
    log: () => ({ info: () => {}, warn: () => {}, error: () => {}, debug: () => {} }),
  };
}

const createClient = () =>
  new TextToSpeechClient(
    {
      fallback: true,
      projectId: 'test-project',
      apiEndpoint: 'localhost',
      port: 18080,
      protocol: 'http',
      apiKey: 'mock-api-key',
    },
    fallbackGax,
  );

export const run = async () => {
  const client = createClient();

  const [response] = await client.synthesizeSpeech({
    input: { text: 'hello from mock synthesize' },
    voice: { languageCode: 'en-US', name: 'en-US-Standard-A' },
    audioConfig: { audioEncoding: 'MP3' },
  });

  assert.ok(response.audioContent, 'audioContent should exist');
  const audioBuffer = Buffer.from(response.audioContent);
  assert.strictEqual(audioBuffer.length, 4);
  assert.deepStrictEqual(Array.from(audioBuffer), [1, 2, 3, 4]);

  await client.close();
  return 'PASS: synthesizeSpeech() works against local HTTP mock server';
};
