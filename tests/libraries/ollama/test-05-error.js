import assert from 'assert';
import { Ollama } from 'ollama';

export const run = async () => {
  const mockFetch = async () => {
    return new Response(JSON.stringify({ error: 'model not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const client = new Ollama({ host: 'http://localhost:18080', fetch: mockFetch });

  let captured = null;
  try {
    await client.show({ model: 'missing-model' });
  } catch (error) {
    captured = error;
  }

  assert.ok(captured, 'Expected show() to throw for HTTP 404');
  assert.strictEqual(captured.status_code, 404);
  assert.strictEqual(captured.error, 'model not found');
  assert.match(String(captured.message), /model not found/);

  return 'PASS: non-2xx API responses throw ResponseError details';
};
