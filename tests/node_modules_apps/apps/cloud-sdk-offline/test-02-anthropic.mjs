import assert from 'node:assert';
import Anthropic from '@anthropic-ai/sdk';

export const run = () => {
  const client = new Anthropic({ apiKey: 'sk-ant-test', baseURL: 'https://example.invalid' });
  assert.strictEqual(typeof client.messages.create, 'function');
  assert.strictEqual(typeof client.models.list, 'function');
  const error = new Anthropic.APIError(401, { error: { message: 'unauthorized' } }, 'unauthorized', {});
  assert.strictEqual(error.status, 401);
  return 'PASS: Anthropic SDK imports and exposes offline client surfaces from node_modules';
};
