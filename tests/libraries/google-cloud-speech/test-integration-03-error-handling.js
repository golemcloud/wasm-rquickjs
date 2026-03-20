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

  let error = null;
  try {
    await client.recognize({
      recognizer: 'projects/test-project/locations/us-central1/recognizers/trigger-error',
      config: {
        autoDecodingConfig: {},
        languageCodes: ['en-US'],
        model: 'latest_short',
      },
      content: Buffer.from([1, 2]),
    });
  } catch (caught) {
    error = caught;
  }

  assert.ok(error, 'recognize should throw on mocked HTTP 500 response');
  assert.strictEqual(error.code, 500);
  assert.ok(String(error.message).includes('mock recognize failure'));

  await client.close();
  return 'PASS: recognize() propagates HTTP 500 errors from local mock server';
};
