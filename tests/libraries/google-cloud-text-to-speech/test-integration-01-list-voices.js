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

  const [response] = await client.listVoices({ languageCode: 'en-US' });

  assert.ok(Array.isArray(response.voices));
  assert.strictEqual(response.voices.length, 1);
  assert.strictEqual(response.voices[0].name, 'en-US-Standard-A');
  assert.strictEqual(response.voices[0].languageCodes[0], 'en-US');

  await client.close();
  return 'PASS: listVoices() works against local HTTP mock server';
};
