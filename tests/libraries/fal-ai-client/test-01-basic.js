import assert from 'assert';
import { createFalClient, parseEndpointId } from '@fal-ai/client';

export const run = () => {
  const client = createFalClient({
    credentials: 'test-key:test-secret',
    fetch: async () => {
      throw new Error('Fetch should not be called in test-01-basic');
    },
  });

  assert.strictEqual(typeof client.run, 'function');
  assert.strictEqual(typeof client.subscribe, 'function');
  assert.strictEqual(typeof client.stream, 'function');
  assert.strictEqual(typeof client.queue.submit, 'function');
  assert.strictEqual(typeof client.realtime.connect, 'function');

  const standard = parseEndpointId('fal-ai/fast-sdxl');
  assert.deepStrictEqual(standard, {
    owner: 'fal-ai',
    alias: 'fast-sdxl',
    path: undefined,
  });

  const namespaced = parseEndpointId('workflows/my-flow/entrypoint');
  assert.deepStrictEqual(namespaced, {
    namespace: 'workflows',
    owner: 'my-flow',
    alias: 'entrypoint',
    path: undefined,
  });

  const normalized = parseEndpointId('12345-test-app');
  assert.deepStrictEqual(normalized, {
    owner: '12345',
    alias: 'test-app',
    path: undefined,
  });

  return 'PASS: createFalClient exposes expected API and parseEndpointId normalizes ids';
};
