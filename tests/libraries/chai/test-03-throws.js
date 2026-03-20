import { assert, expect } from 'chai';

export const run = () => {
  const boom = () => {
    const error = new TypeError('boom');
    error.code = 'E_BOOM';
    throw error;
  };

  assert.throws(boom, TypeError, /boom/);
  assert.doesNotThrow(() => 42);
  expect(boom).to.throw(TypeError, /boom/).with.property('code', 'E_BOOM');

  return 'PASS: throw assertions inspect type and message';
};
