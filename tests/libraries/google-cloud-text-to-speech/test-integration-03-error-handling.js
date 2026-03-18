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

  let error = null;
  try {
    await client.synthesizeSpeech({
      input: { text: 'trigger-error' },
      voice: { languageCode: 'en-US', name: 'en-US-Standard-A' },
      audioConfig: { audioEncoding: 'MP3' },
    });
  } catch (caught) {
    error = caught;
  }

  assert.ok(error, 'synthesizeSpeech should throw on mocked HTTP 500 response');
  assert.strictEqual(error.code, 500);
  assert.ok(String(error.message).includes('mock synthesize failure'));

  await client.close();
  return 'PASS: synthesizeSpeech() propagates HTTP 500 errors from local mock server';
};
