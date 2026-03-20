import assert from 'assert';
import { Leonardo } from '@leonardo-ai/sdk';

export const run = () => {
  const client = new Leonardo({
    bearerAuth: 'test-token',
    serverURL: 'http://localhost:18080',
  });

  assert.ok(client.image, 'image namespace should be available');
  assert.ok(client.models, 'models namespace should be available');
  assert.ok(client.prompt, 'prompt namespace should be available');
  assert.ok(client.user, 'user namespace should be available');
  assert.ok(client.motion, 'motion namespace should be available');
  assert.ok(client.variation, 'variation namespace should be available');

  return 'PASS: Leonardo client exposes expected API namespaces';
};
