import assert from 'assert';
import { DeepgramClient } from '@deepgram/sdk';

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const run = () => {
  const client = new DeepgramClient({ apiKey: 'test-api-key' });

  assert.ok(client.listen?.v1?.media, 'listen.v1.media should exist');
  assert.ok(client.speak?.v1?.audio, 'speak.v1.audio should exist');
  assert.ok(client.read?.v1?.text, 'read.v1.text should exist');
  assert.ok(client.manage?.v1?.models, 'manage.v1.models should exist');
  assert.ok(client.auth?.v1?.tokens, 'auth.v1.tokens should exist');

  assert.match(client._sessionId, UUID_V4_RE, 'session id should be a UUID v4');
  assert.strictEqual(client._options.headers['x-deepgram-session-id'], client._sessionId);

  return 'PASS: client initialization and namespace availability';
};
