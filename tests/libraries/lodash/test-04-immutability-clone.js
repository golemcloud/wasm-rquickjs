import assert from 'assert';
import _ from 'lodash';

export const run = () => {
  const original = {
    name: 'root',
    nested: {
      list: [1, { x: 2 }],
    },
    meta: new Map([['k', 'v']]),
  };

  const copy = _.cloneDeep(original);
  copy.nested.list[1].x = 99;

  assert.strictEqual(original.nested.list[1].x, 2);
  assert.strictEqual(copy.nested.list[1].x, 99);
  assert.strictEqual(_.isEqual(original.meta, copy.meta), true);

  const merged = _.merge({ a: { b: 1 } }, { a: { c: 2 } });
  assert.deepStrictEqual(merged, { a: { b: 1, c: 2 } });

  return 'PASS: cloneDeep isolation and merge semantics work';
};
