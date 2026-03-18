import assert from 'assert';
import { parseInline } from 'marked';

export const run = () => {
  const html = parseInline('A [link](https://example.com/docs) and `code`');

  assert.ok(html.includes('<a href="https://example.com/docs">link</a>'));
  assert.ok(html.includes('<code>code</code>'));

  return 'PASS: parseInline handles inline markdown links and code spans';
};
