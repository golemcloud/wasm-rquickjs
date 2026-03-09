import { assert, expect } from 'chai';

export const run = () => {
  assert.strictEqual(2 + 2, 4);
  expect('chai').to.be.a('string').and.include('ha');
  expect([1, 2, 3]).to.have.lengthOf(3);

  return 'PASS: basic assert/expect checks work';
};
