import assert from 'assert';
import nunjucks from 'nunjucks';

export const run = () => {
  const env = new nunjucks.Environment([], { autoescape: true });
  const out = env.renderString('Hello {{ name }}! Escaped={{ html }} Raw={{ html | safe }}', {
    name: 'Nunjucks',
    html: '<b>&</b>',
  });

  assert.strictEqual(out, 'Hello Nunjucks! Escaped=&lt;b&gt;&amp;&lt;/b&gt; Raw=<b>&</b>');
  return 'PASS: basic renderString interpolation, escaping, and safe output work';
};
