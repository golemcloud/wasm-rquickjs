import assert from 'assert';
import Mocha from 'mocha';

export const run = () => {
  const { reporters } = Mocha;
  const mocha = new Mocha({ color: false });

  assert.strictEqual(typeof reporters.Base, 'function');
  assert.strictEqual(typeof reporters.Spec, 'function');
  assert.strictEqual(typeof reporters.Min, 'function');
  assert.strictEqual(typeof reporters.JSON, 'function');

  mocha.reporter('min');
  assert.strictEqual(mocha._reporter, reporters.Min);

  mocha.reporter('spec');
  assert.strictEqual(mocha._reporter, reporters.Spec);

  return 'PASS: Built-in reporter registry and selection APIs work';
};
