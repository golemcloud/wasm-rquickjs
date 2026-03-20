import assert from 'assert';
import ejs from 'ejs';

export const run = () => {
  const template = 'Hello <%= name %>! Escaped=<%= value %> Raw=<%- value %>';
  const output = ejs.render(template, { name: 'EJS', value: '<b>tag</b>' });

  assert.strictEqual(output, 'Hello EJS! Escaped=&lt;b&gt;tag&lt;/b&gt; Raw=<b>tag</b>');
  return 'PASS: basic render escapes and outputs raw values correctly';
};
