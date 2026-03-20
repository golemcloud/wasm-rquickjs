import assert from 'assert';
import {
  days,
  hours,
  minutes,
  seconds,
  weeks,
  ThrottlerException,
} from '@nestjs/throttler';

export const run = () => {
  assert.strictEqual(seconds(1), 1000);
  assert.strictEqual(minutes(1), 60_000);
  assert.strictEqual(hours(1), 3_600_000);
  assert.strictEqual(days(1), 86_400_000);
  assert.strictEqual(weeks(1), 604_800_000);

  const exception = new ThrottlerException('rate limit exceeded');
  assert.strictEqual(exception.getStatus(), 429);
  assert.strictEqual(exception.message, 'rate limit exceeded');

  return 'PASS: helper time functions and ThrottlerException work';
};
