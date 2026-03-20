import assert from 'assert';
import Mustache from 'mustache';

export const run = () => {
  const custom = Mustache.render(
    '[[greeting]], [[name]]!',
    { greeting: 'Hi', name: 'R&D' },
    {},
    {
      tags: ['[[', ']]'],
      escape: (value) => String(value).replaceAll('&', '(and)'),
    }
  );
  assert.strictEqual(custom, 'Hi, R(and)D!');

  Mustache.clearCache();
  Mustache.parse('A={{a}}');
  const first = Mustache.render('A={{a}}', { a: 1 });
  assert.strictEqual(first, 'A=1');

  Mustache.templateCache = new Map();
  Mustache.parse('B={{b}}');
  const second = Mustache.render('B={{b}}', { b: 2 });
  assert.strictEqual(second, 'B=2');

  Mustache.templateCache = undefined;
  const third = Mustache.render('C={{c}}', { c: 3 });
  assert.strictEqual(third, 'C=3');

  return 'PASS: custom tags/escape and cache APIs behave as expected';
};
