import assert from 'assert';
import Mustache from 'mustache';

export const run = () => {
  const template = '{{#items}}{{>item}}{{/items}}';

  const mapRendered = Mustache.render(
    template,
    {
      items: [{ value: 'A' }, { value: 'B' }],
    },
    {
      item: '[{{value}}]',
    }
  );
  assert.strictEqual(mapRendered, '[A][B]');

  const loaderRendered = Mustache.render(
    template,
    {
      items: [{ value: 'X' }, { value: 'Y' }],
    },
    (name) => (name === 'item' ? '({{value}})' : '')
  );
  assert.strictEqual(loaderRendered, '(X)(Y)');

  return 'PASS: partials work with object maps and loader functions';
};
