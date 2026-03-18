import assert from 'assert';
import Handlebars from 'handlebars';

export const run = () => {
  const hbs = Handlebars.create();

  hbs.registerPartial('layout', '<section><h1>{{title}}</h1>{{> @partial-block }}</section>');

  const template = hbs.compile('{{#> layout title=title}}Items:{{#each items}} {{@index}}={{this}}{{/each}}{{/layout}}');
  const output = template({ title: 'Inventory', items: ['apple', 'pear'] });

  assert.strictEqual(output, '<section><h1>Inventory</h1>Items: 0=apple 1=pear</section>');
  return 'PASS: partial block and each data variables render correctly';
};
