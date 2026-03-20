import assert from 'assert';
import { DeepgramClient } from '@deepgram/sdk';

const BASE = 'http://localhost:18080';

export const run = async () => {
  const client = new DeepgramClient({
    apiKey: 'mock-api-key',
    baseUrl: BASE,
  });

  const response = await client.speak.v1.audio.generate({
    text: 'Hello from deepgram mock',
    model: 'aura-2-thalia-en',
    encoding: 'linear16',
    container: 'wav',
  });

  const bytes = new Uint8Array(await response.arrayBuffer());
  assert.strictEqual(bytes[0], 82);
  assert.strictEqual(bytes[1], 73);
  assert.ok(bytes.length >= 8);

  return 'PASS: speak.audio.generate returns binary audio payload';
};
