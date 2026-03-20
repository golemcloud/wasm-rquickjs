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
  const client = new SpeechClient(
    {
      fallback: true,
      credentials,
      projectId: 'test-project',
    },
    fallbackGax,
  );

  assert.strictEqual(SpeechClient.port, 443);
  assert.ok(SpeechClient.scopes.includes('https://www.googleapis.com/auth/cloud-platform'));
  assert.strictEqual(client.apiEndpoint, 'speech.googleapis.com');
  assert.strictEqual(client.universeDomain, 'googleapis.com');
  return 'PASS: v2 SpeechClient construction and static metadata are available offline';
};
