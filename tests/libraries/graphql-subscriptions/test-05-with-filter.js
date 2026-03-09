import assert from 'assert';
import { withFilter } from 'graphql-subscriptions';

async function collectAll(asyncIterator) {
  const values = [];
  while (true) {
    const item = await asyncIterator.next();
    if (item.done) break;
    values.push(item.value);
  }
  return values;
}

async function* numbers(items) {
  for (const value of items) {
    yield value;
  }
}

export const run = async () => {
  const onlyEven = withFilter(
    async () => numbers([1, 2, 3, 4, 5, 6]),
    (payload) => payload % 2 === 0,
  );

  const filteredSync = await collectAll(await onlyEven(null, {}, {}, {}));
  assert.deepStrictEqual(filteredSync, [2, 4, 6]);

  const greaterThanThree = withFilter(
    async () => numbers([1, 2, 3, 4, 5]),
    async (payload) => payload > 3,
  );

  const filteredAsync = await collectAll(await greaterThanThree(null, {}, {}, {}));
  assert.deepStrictEqual(filteredAsync, [4, 5]);

  return 'PASS: withFilter supports sync and async predicates';
};
