import assert from 'assert';
import Mocha from 'mocha';

export const run = () => {
  const mocha = new Mocha();
  const rootHooks = {
    beforeAll: [() => {}],
    beforeEach: [() => {}],
    afterEach: [() => {}],
    afterAll: [() => {}],
  };

  assert.strictEqual(mocha.grep(/math/), mocha);
  assert.strictEqual(mocha.fgrep('sum path'), mocha);
  assert.strictEqual(mocha.invert(), mocha);
  assert.strictEqual(mocha.rootHooks(rootHooks), mocha);

  assert.ok(mocha.options.grep instanceof RegExp);
  assert.strictEqual(mocha.options.grep.source.includes('sum path'), true);
  assert.strictEqual(mocha.options.invert, true);
  assert.strictEqual(mocha.suite._beforeAll.length, 1);
  assert.strictEqual(mocha.suite._beforeEach.length, 1);
  assert.strictEqual(mocha.suite._afterEach.length, 1);
  assert.strictEqual(mocha.suite._afterAll.length, 1);

  return 'PASS: grep/fgrep/invert and rootHooks configuration work';
};
