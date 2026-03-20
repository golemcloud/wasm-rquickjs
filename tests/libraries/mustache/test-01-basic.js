import assert from 'assert';
import Mustache from 'mustache';

export const run = () => {
  const template = 'Hello, {{name}}! Escaped={{unsafe}} Raw={{{unsafe}}}';
  const view = {
    name: 'Mustache',
    unsafe: '<b>&"</b>',
  };

  const out = Mustache.render(template, view);
  assert.strictEqual(out, 'Hello, Mustache! Escaped=&lt;b&gt;&amp;&quot;&lt;&#x2F;b&gt; Raw=<b>&"</b>');

  return 'PASS: basic render escapes HTML and supports triple-mustache raw output';
};
