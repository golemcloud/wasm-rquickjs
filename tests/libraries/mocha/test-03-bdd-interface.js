import assert from 'assert';
import Mocha from 'mocha';

export const run = () => {
  const mocha = new Mocha({ ui: 'bdd' });
  const context = {};

  mocha.suite.emit('pre-require', context, 'inline.js', mocha);

  assert.strictEqual(typeof context.describe, 'function');
  assert.strictEqual(typeof context.it, 'function');

  context.describe('bdd suite', () => {
    context.it('creates a test case', () => {
      assert.strictEqual('ok'.toUpperCase(), 'OK');
    });
  });

  assert.strictEqual(mocha.suite.suites.length, 1);
  assert.strictEqual(mocha.suite.suites[0].title, 'bdd suite');
  assert.strictEqual(mocha.suite.suites[0].tests.length, 1);

  return 'PASS: BDD interface hooks can define suites/tests programmatically';
};
