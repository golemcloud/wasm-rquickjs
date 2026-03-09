import { assert, expect } from 'chai';

export const run = () => {
  expect([3, 2, 1]).to.have.members([1, 2, 3]);
  expect([{ id: 1 }, { id: 2 }]).to.deep.include({ id: 2 });
  expect(new Set(['a', 'b'])).to.have.all.keys('a', 'b');

  assert.containsSubset(
    {
      config: { retry: 3, mode: 'safe' },
      enabled: true,
    },
    {
      config: { retry: 3 },
    },
  );

  return 'PASS: members, key sets, and subset assertions work';
};
