import assert from 'assert';
import { Stream } from 'typedb-driver';

export const run = async () => {
  const evenTimesTen = await Stream.array([1, 2, 3, 4, 5])
    .filter((n) => n % 2 === 0)
    .map((n) => n * 10)
    .collect();
  assert.deepStrictEqual(evenTimesTen, [20, 40]);

  const flattened = await Stream.array([1, 2, 3])
    .flatMap((n) => Stream.array([n, n * 100]))
    .collect();
  assert.deepStrictEqual(flattened, [1, 100, 2, 200, 3, 300]);

  const allPositive = await Stream.array([1, 2, 3]).every((n) => n > 0);
  const anyGreaterThanTen = await Stream.array([1, 2, 3]).some((n) => n > 10);
  assert.strictEqual(allPositive, true);
  assert.strictEqual(anyGreaterThanTen, false);

  const promised = await Stream.promises([Promise.resolve('a'), Promise.resolve('b')]).collect();
  assert.deepStrictEqual(promised, ['a', 'b']);

  const first = await Stream.array([9, 8, 7]).first();
  const missing = await Stream.array([]).first();
  assert.strictEqual(first, 9);
  assert.strictEqual(missing, null);

  let sum = 0;
  await Stream.array([2, 4, 6]).forEach((n) => {
    sum += n;
  });
  assert.strictEqual(sum, 12);

  return 'PASS: Stream helpers (filter/map/flatMap/every/some/forEach/first) behave correctly';
};
