import assert from 'assert';
import Handlebars from 'handlebars';

export const run = () => {
  const hbs = Handlebars.create();

  hbs.registerHelper('upper', (value) => String(value).toUpperCase());
  hbs.registerHelper('safeLink', (url, label) => {
    const safeUrl = hbs.escapeExpression(url);
    const safeLabel = hbs.escapeExpression(label);
    return new hbs.SafeString(`<a href="${safeUrl}">${safeLabel}</a>`);
  });

  const template = hbs.compile('{{upper name}}|{{safeLink url label}}');
  const output = template({
    name: 'Handlebars',
    url: '/docs?q=<script>',
    label: 'Docs & Guides',
  });

  assert.strictEqual(output, 'HANDLEBARS|<a href="/docs?q&#x3D;&lt;script&gt;">Docs &amp; Guides</a>');
  return 'PASS: helpers and SafeString work with explicit escaping';
};
