import assert from 'assert';
import Mocha from 'mocha';

export const run = () => {
  const mocha = new Mocha({
    timeout: 1200,
    color: false,
    bail: true,
    ui: 'bdd',
    reporter: 'spec',
  });

  assert.ok(mocha instanceof Mocha);
  assert.strictEqual(Array.isArray(mocha.files), true);
  assert.strictEqual(mocha.files.length, 0);
  assert.strictEqual(mocha.timeout(3000), mocha);
  assert.strictEqual(mocha.retries(2), mocha);
  assert.strictEqual(mocha.slow(250), mocha);
  assert.strictEqual(mocha.suite.timeout(), 3000);
  assert.strictEqual(mocha.suite.retries(), 2);
  assert.strictEqual(mocha.suite.slow(), 250);
  assert.strictEqual(mocha.options.bail, true);

  return 'PASS: Mocha constructor and chainable option setters work';
};
