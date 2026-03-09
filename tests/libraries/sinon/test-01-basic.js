import assert from 'assert';
import sinon from 'sinon';

export const run = () => {
  const add = (a, b) => a + b;
  const spy = sinon.spy(add);

  const result = spy(2, 3);

  assert.strictEqual(result, 5);
  assert.strictEqual(spy.calledOnce, true);
  assert.strictEqual(spy.calledWithExactly(2, 3), true);
  assert.strictEqual(spy.firstCall.returnValue, 5);

  return 'PASS: spy tracks function calls and return values';
};
