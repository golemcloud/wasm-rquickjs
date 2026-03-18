import assert from 'assert';
import { createClient } from './helpers.js';

export const run = () => {
  const client = createClient('test-brave-key');

  const formatted = client.formatOptions({
    count: 5,
    text_decorations: false,
    spellcheck: true,
    safesearch: 'off',
    extra_snippets: true,
    ignored: undefined,
  });

  assert.deepStrictEqual(formatted, {
    count: '5',
    text_decorations: 'false',
    spellcheck: 'true',
    safesearch: 'off',
    extra_snippets: 'true',
  });

  const headers = client.getHeaders();
  assert.strictEqual(headers.Accept, 'application/json');
  assert.strictEqual(headers['Accept-Encoding'], 'gzip');
  assert.strictEqual(headers['X-Subscription-Token'], 'test-brave-key');

  return 'PASS: option formatting and auth header generation work as expected';
};
