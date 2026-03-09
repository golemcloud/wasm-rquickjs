import assert from 'assert';
import Mocha from 'mocha';

export const run = () => {
  const { Context, Suite, Test } = Mocha;

  const rootSuite = new Suite('', new Context(), true);
  const arithmeticSuite = Suite.create(rootSuite, 'arithmetic');

  arithmeticSuite.beforeAll('setup', () => {});
  arithmeticSuite.afterAll('teardown', () => {});

  arithmeticSuite.addTest(new Test('adds numbers', () => {
    assert.strictEqual(2 + 3, 5);
  }));

  arithmeticSuite.addTest(new Test('multiplies numbers', () => {
    assert.strictEqual(4 * 6, 24);
  }));

  assert.strictEqual(rootSuite.total(), 2);
  assert.strictEqual(arithmeticSuite.tests.length, 2);
  assert.strictEqual(arithmeticSuite._beforeAll.length, 1);
  assert.strictEqual(arithmeticSuite._afterAll.length, 1);
  assert.strictEqual(arithmeticSuite.fullTitle(), 'arithmetic');
  assert.strictEqual(arithmeticSuite.tests[0].fullTitle(), 'arithmetic adds numbers');

  return 'PASS: Suite/Test tree construction APIs work';
};
