import assert from 'assert';
import Cartesia from '@cartesia/cartesia-js';

const BASE = 'http://localhost:18080';

export const run = async () => {
  const client = new Cartesia({
    token: 'test-token',
    baseURL: BASE,
  });

  const status = await client.getStatus();
  assert.strictEqual(status.status, 'ok');
  assert.strictEqual(status.version, 'mock-2026-03-18');

  const voices = await client.voices.list({
    limit: 2,
    q: 'voice',
    expand: ['preview_file_url'],
  });

  assert.strictEqual(Array.isArray(voices.data), true);
  assert.strictEqual(voices.data.length, 2);
  assert.strictEqual(voices.data[0].id, 'voice-1');
  assert.strictEqual(typeof voices.data[0].preview_file_url, 'string');

  return 'PASS: status and voices.list work against mock HTTP server';
};
