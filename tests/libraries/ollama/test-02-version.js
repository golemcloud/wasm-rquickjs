import assert from 'assert';
import { Ollama } from 'ollama';

export const run = async () => {
  const calls = [];
  const mockFetch = async (url, init = {}) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ version: '0.6.3' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const client = new Ollama({
    host: 'http://localhost:18080',
    headers: { 'X-Test-Header': 'ollama' },
    fetch: mockFetch,
  });

  const version = await client.version();
  assert.strictEqual(version.version, '0.6.3');
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].url, 'http://localhost:18080/api/version');

  const requestHeaders = new Headers(calls[0].init.headers);
  assert.strictEqual(requestHeaders.get('x-test-header'), 'ollama');

  return 'PASS: version() calls /api/version with configured host and headers';
};
