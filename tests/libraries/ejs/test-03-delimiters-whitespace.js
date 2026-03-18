import assert from 'assert';
import ejs from 'ejs';

export const run = () => {
  const template = [
    '[? if (items.length) { ?]',
    '  <ul>',
    '  [? for (const item of items) { ?]',
    '    <li>[?= item ?]</li>',
    '  [? } ?]',
    '  </ul>',
    '[? } ?]',
  ].join('\n');

  const output = ejs.render(template, { items: ['one', 'two'] }, {
    openDelimiter: '[',
    closeDelimiter: ']',
    delimiter: '?',
    rmWhitespace: true,
  });

  const compact = output.replace(/\s+/g, '');
  assert.strictEqual(compact, '<ul><li>one</li><li>two</li></ul>');
  return 'PASS: custom delimiters and whitespace trimming work';
};
