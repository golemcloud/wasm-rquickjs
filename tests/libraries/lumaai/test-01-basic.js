import assert from 'assert';
import 'lumaai/shims/web';
import LumaAI from 'lumaai';

export const run = () => {
  const originalToken = process.env.LUMAAI_API_KEY;
  delete process.env.LUMAAI_API_KEY;

  try {
    assert.throws(
      () => new LumaAI(),
      /LUMAAI_API_KEY|authToken/i,
      'Expected constructor to require auth token',
    );
  } finally {
    if (originalToken === undefined) {
      delete process.env.LUMAAI_API_KEY;
    } else {
      process.env.LUMAAI_API_KEY = originalToken;
    }
  }

  const client = new LumaAI({
    authToken: 'test-token',
    baseURL: 'http://localhost:18080/dream-machine/v1',
  });

  assert.ok(client.generations, 'Expected generations resource');
  assert.ok(client.ping, 'Expected ping resource');
  assert.ok(client.credits, 'Expected credits resource');

  return 'PASS: client initialization validates auth token and exposes API resources';
};
