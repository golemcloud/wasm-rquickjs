import assert from 'assert';
import ejs from 'ejs';

export const run = async () => {
  const template = '<%= await Promise.resolve(prefix + suffix) %>';
  const compiled = ejs.compile(template, { async: true });

  const output = await compiled({ prefix: 'as', suffix: 'ync' });
  assert.strictEqual(output, 'async');

  const rendered = await ejs.render('<%= await Promise.resolve(n * 2) %>', { n: 21 }, { async: true });
  assert.strictEqual(rendered, '42');

  return 'PASS: async compile and async render return awaited output';
};
