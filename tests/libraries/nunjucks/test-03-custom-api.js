import assert from 'assert';
import nunjucks from 'nunjucks';

export const run = () => {
  const env = new nunjucks.Environment([]);

  env.addFilter('slugify', (value) => String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, ''));

  env.addTest('atleast3', (value) => value >= 3);
  env.addGlobal('appName', 'templater');

  const out = env.renderString(
    '{{ appName }}|{{ title | slugify }}|{% if count is atleast3 %}in{% else %}out{% endif %}',
    { title: 'Hello Nunjucks', count: 3 }
  );

  assert.strictEqual(out, 'templater|hello-nunjucks|in');
  return 'PASS: addFilter/addTest/addGlobal APIs work for rendering';
};
