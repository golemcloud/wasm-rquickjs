import assert from 'assert';
import { SpeechClient } from '@google-cloud/speech/build/src/v2/index.js';
import { fallback as fallbackGax } from 'google-gax';

if (!fallbackGax.loggingUtils) {
  fallbackGax.loggingUtils = {
    log: () => ({ info: () => {}, warn: () => {}, error: () => {}, debug: () => {} }),
  };
}

const credentials = {
  client_email: 'test@example.com',
  private_key: '-----BEGIN PRIVATE KEY-----\ninvalid\n-----END PRIVATE KEY-----\n',
};

export const run = () => {
  const customDomainClient = new SpeechClient(
    {
      fallback: true,
      credentials,
      projectId: 'project-a',
      universeDomain: 'example.com',
    },
    fallbackGax,
  );
  assert.strictEqual(customDomainClient.apiEndpoint, 'speech.example.com');

  let mismatchError = null;
  try {
    // eslint-disable-next-line no-new
    new SpeechClient(
      {
        fallback: true,
        credentials,
        projectId: 'project-a',
        universeDomain: 'example.com',
        universe_domain: 'googleapis.com',
      },
      fallbackGax,
    );
  } catch (error) {
    mismatchError = error;
  }

  assert.ok(mismatchError instanceof Error, 'mismatched universe domain options should throw');
  assert.ok(String(mismatchError.message).includes('universeDomain'));

  return 'PASS: universe domain validation and endpoint derivation work as expected';
};
