import assert from 'assert';
import _ from 'lodash';

export const run = () => {
  const values = [1, 2, 3, 4, 5, 6, 6, 4, 2];
  const result = _.chain(values)
    .filter((n) => n % 2 === 0)
    .uniq()
    .sortBy()
    .value();

  assert.deepStrictEqual(result, [2, 4, 6]);
  return 'PASS: basic chaining/filter/uniq works';
};
