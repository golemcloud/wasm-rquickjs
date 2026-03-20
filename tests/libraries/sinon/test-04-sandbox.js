import assert from 'assert';
import sinon from 'sinon';

export const run = () => {
  const sandbox = sinon.createSandbox();
  const calculator = {
    multiply(a, b) {
      return a * b;
    },
  };

  const fakeMultiply = sandbox.fake.returns(99);
  sandbox.replace(calculator, 'multiply', fakeMultiply);

  assert.strictEqual(calculator.multiply(3, 4), 99);
  assert.strictEqual(fakeMultiply.calledOnce, true);

  sandbox.restore();

  assert.strictEqual(calculator.multiply(3, 4), 12);

  return 'PASS: sandbox replace and restore work correctly';
};
