import assert from 'assert';
import { Ollama } from 'ollama';

export const run = async () => {
  const calls = [];
  const mockFetch = async (url) => {
    calls.push(url);
    return new Response(JSON.stringify({ version: '0.6.3' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const defaultClient = new Ollama({ fetch: mockFetch });
  await defaultClient.version();

  const portOnlyClient = new Ollama({ host: ':18081', fetch: mockFetch });
  await portOnlyClient.version();

  const httpsClient = new Ollama({ host: 'https://example.com', fetch: mockFetch });
  await httpsClient.version();

  assert.deepStrictEqual(calls, [
    'http://127.0.0.1:11434/api/version',
    'http://127.0.0.1:18081/api/version',
    'https://example.com:443/api/version',
  ]);

  return 'PASS: constructor host normalization covers default, port-only, and HTTPS hosts';
};
