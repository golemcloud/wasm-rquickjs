import assert from 'node:assert';
import OpenAI from 'openai';

export const run = () => {
  const client = new OpenAI({ apiKey: 'sk-test', baseURL: 'https://example.invalid/v1' });
  assert.strictEqual(typeof client.chat.completions.create, 'function');
  assert.strictEqual(typeof client.files.create, 'function');
  const error = new OpenAI.APIError(400, { error: { message: 'bad request' } }, 'bad request', {});
  assert.strictEqual(error.status, 400);
  return 'PASS: OpenAI SDK imports and exposes offline client surfaces from node_modules';
};
