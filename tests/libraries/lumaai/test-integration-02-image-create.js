import assert from 'assert';
import 'lumaai/shims/web';
import LumaAI from 'lumaai';

export const run = async () => {
  const client = new LumaAI({
    authToken: 'test-token',
    baseURL: 'http://localhost:18080/dream-machine/v1',
  });

  const generation = await client.generations.image.create({
    model: 'photon-1',
    prompt: 'A paper boat on a moonlit river',
    aspect_ratio: '16:9',
  });

  assert.strictEqual(generation.id, 'gen-image-int-1');
  assert.strictEqual(generation.state, 'queued');
  assert.strictEqual(generation.generation_type, 'image');

  return 'PASS: generations.image.create works against local HTTP mock server';
};
