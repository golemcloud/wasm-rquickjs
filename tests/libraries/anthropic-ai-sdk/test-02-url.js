import assert from 'assert';
import Anthropic from '@anthropic-ai/sdk';

export const run = () => {
  const client = new Anthropic({
    apiKey: 'test-anthropic-api-key',
    baseURL: 'https://example.com/custom/',
    defaultQuery: { workspace: 'demo' },
  });

  const built = client.buildURL('/v1/messages', { page: '2' });
  const parsed = new URL(built);

  assert.strictEqual(parsed.origin, 'https://example.com');
  assert.strictEqual(parsed.pathname, '/custom/v1/messages');
  assert.strictEqual(parsed.searchParams.get('workspace'), 'demo');
  assert.strictEqual(parsed.searchParams.get('page'), '2');

  return 'PASS: buildURL applies baseURL and default/per-request query params';
};
