import assert from 'assert';
import { TextToSpeechClient } from '@google-cloud/text-to-speech/build/src/v1/index.js';
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

export const run = async () => {
  const client = new TextToSpeechClient(
    {
      fallback: true,
      credentials,
      projectId: 'test-project',
    },
    fallbackGax,
  );

  assert.strictEqual(TextToSpeechClient.port, 443);
  assert.ok(TextToSpeechClient.scopes.includes('https://www.googleapis.com/auth/cloud-platform'));
  assert.strictEqual(client.apiEndpoint, 'texttospeech.googleapis.com');
  assert.strictEqual(client.universeDomain, 'googleapis.com');

  await client.close();
  return 'PASS: TextToSpeechClient construction and static metadata are available offline';
};
