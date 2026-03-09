import { assert, expect } from 'chai';

export const run = () => {
  const payload = {
    user: {
      name: 'Ada',
      roles: [{ id: 1, scope: 'admin' }],
    },
    settings: {
      retries: 3,
    },
  };

  assert.deepEqual({ a: { b: [1, 2] } }, { a: { b: [1, 2] } });
  expect(payload).to.have.nested.property('user.roles[0].scope', 'admin');
  expect(payload).to.deep.include({
    settings: {
      retries: 3,
    },
  });

  return 'PASS: deep equality and nested property assertions work';
};
