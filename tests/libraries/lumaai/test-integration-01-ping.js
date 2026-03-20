import assert from 'assert';
import 'lumaai/shims/web';
import LumaAI from 'lumaai';

export const run = async () => {
  const client = new LumaAI({
    authToken: 'test-token',
    baseURL: 'http://localhost:18080/dream-machine/v1',
  });

  const response = await client.ping.check();
  assert.strictEqual(response.message, 'pong');

  return 'PASS: ping.check works against local HTTP mock server';
};
