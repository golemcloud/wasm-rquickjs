import assert from 'assert';
import { SpeechClient } from '@google-cloud/speech/build/src/v2/index.js';
import { fallback as fallbackGax } from 'google-gax';

if (!fallbackGax.loggingUtils) {
  fallbackGax.loggingUtils = {
    log: () => ({ info: () => {}, warn: () => {}, error: () => {}, debug: () => {} }),
  };
}

const createClient = () =>
  new SpeechClient(
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

  const [response] = await client.recognize({
    recognizer: 'projects/test-project/locations/us-central1/recognizers/_',
    config: {
      autoDecodingConfig: {},
      languageCodes: ['en-US'],
      model: 'latest_short',
    },
    content: Buffer.from([1, 2, 3, 4]),
  });

  assert.strictEqual(response.results.length, 1);
  assert.strictEqual(response.results[0].alternatives.length, 1);
  assert.strictEqual(response.results[0].alternatives[0].transcript, 'mock transcript');
  assert.strictEqual(response.results[0].languageCode, 'en-US');

  await client.close();
  return 'PASS: recognize() works against local HTTP mock server';
};
