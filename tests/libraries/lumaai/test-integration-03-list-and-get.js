import assert from 'assert';
import 'lumaai/shims/web';
import LumaAI from 'lumaai';

export const run = async () => {
  const client = new LumaAI({
    authToken: 'test-token',
    baseURL: 'http://localhost:18080/dream-machine/v1',
  });

  const list = await client.generations.list({ limit: 2, offset: 0 });
  const generation = await client.generations.get('gen-complete-1');

  assert.strictEqual(list.generations.length, 2);
  assert.strictEqual(list.count, 2);
  assert.strictEqual(list.has_more, false);
  assert.strictEqual(generation.id, 'gen-complete-1');
  assert.strictEqual(generation.state, 'completed');

  return 'PASS: generations.list/get work against local HTTP mock server';
};
