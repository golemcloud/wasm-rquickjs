import assert from 'assert';
import 'lumaai/shims/web';
import LumaAI from 'lumaai';

export const run = async () => {
  let parsedBody;

  const client = new LumaAI({
    authToken: 'test-token',
    baseURL: 'http://localhost:18080/dream-machine/v1',
    fetch: async (url, init = {}) => {
      assert.ok(String(url).endsWith('/dream-machine/v1/generations/image'));
      assert.strictEqual(String(init.method).toUpperCase(), 'POST');

      parsedBody = JSON.parse(init.body);

      return new Response(
        JSON.stringify({
          id: 'gen-image-001',
          state: 'queued',
          generation_type: 'image',
          model: 'photon-1',
          assets: {
            image: 'https://example.com/fake-image.png',
          },
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    },
  });

  const generation = await client.generations.image.create({
    model: 'photon-1',
    prompt: 'A lighthouse on a cliff at sunrise',
    aspect_ratio: '16:9',
  });

  assert.strictEqual(parsedBody.model, 'photon-1');
  assert.strictEqual(parsedBody.prompt, 'A lighthouse on a cliff at sunrise');
  assert.strictEqual(parsedBody.aspect_ratio, '16:9');
  assert.strictEqual(generation.id, 'gen-image-001');
  assert.strictEqual(generation.state, 'queued');
  assert.strictEqual(generation.generation_type, 'image');

  return 'PASS: generations.image.create sends payload and parses generation response';
};
