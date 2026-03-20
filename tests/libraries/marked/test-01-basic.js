import assert from 'assert';
import { marked } from 'marked';

export const run = () => {
  const html = marked('# Hello\n\nThis is **bold** and _italic_.');

  assert.ok(html.includes('<h1>Hello</h1>'));
  assert.ok(html.includes('<strong>bold</strong>'));
  assert.ok(html.includes('<em>italic</em>'));

  return 'PASS: Basic markdown converts to expected HTML';
};
