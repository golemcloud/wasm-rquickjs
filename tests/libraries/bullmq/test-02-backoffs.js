import assert from 'assert';
import { Backoffs } from 'bullmq';

export const run = () => {
  const normalized = Backoffs.normalize(2500);
  assert.deepStrictEqual(normalized, { type: 'fixed', delay: 2500 });

  const exponentialDelay = Backoffs.calculate(
    { type: 'exponential', delay: 1000 },
    4,
    new Error('boom'),
    {},
    {}
  );
  assert.strictEqual(exponentialDelay, 8000);

  const fixedDelay = Backoffs.calculate(
    { type: 'fixed', delay: 750 },
    3,
    new Error('boom'),
    {},
    {}
  );
  assert.strictEqual(fixedDelay, 750);

  return 'PASS: Backoffs normalize and calculate delays correctly';
};
