import assert from 'assert';
import Handlebars from 'handlebars';

export const run = () => {
  const template = Handlebars.compile('Hello, {{name}}! Escaped={{value}} Raw={{{value}}}');
  const output = template({ name: 'World', value: '<b>tag</b>' });

  assert.strictEqual(output, 'Hello, World! Escaped=&lt;b&gt;tag&lt;/b&gt; Raw=<b>tag</b>');
  return 'PASS: compile renders interpolation and escaping correctly';
};
