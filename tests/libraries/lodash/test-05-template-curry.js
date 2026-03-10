import assert from 'assert';
import _ from 'lodash';

export const run = () => {
  const greet = _.template('Hello <%= name %>!');
  assert.strictEqual(greet({ name: 'World' }), 'Hello World!');

  const sum3 = (a, b, c) => a + b + c;
  const curried = _.curry(sum3);
  assert.strictEqual(curried(1)(2)(3), 6);
  assert.strictEqual(curried(1, 2)(3), 6);

  const memoized = _.memoize((n) => n * 2);
  assert.strictEqual(memoized(10), 20);
  assert.strictEqual(memoized.cache.has(10), true);

  return 'PASS: template, curry, and memoize work';
};
