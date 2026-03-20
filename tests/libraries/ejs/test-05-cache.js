import assert from 'assert';
import ejs from 'ejs';

export const run = () => {
  const cacheKey = '/virtual/cache/template.ejs';

  ejs.clearCache();
  const first = ejs.render('A<%= value %>', { value: 1 }, { cache: true, filename: cacheKey });
  const second = ejs.render('B<%= value %>', { value: 2 }, { cache: true, filename: cacheKey });

  assert.strictEqual(first, 'A1');
  assert.strictEqual(second, 'A2');

  ejs.clearCache();
  const third = ejs.render('B<%= value %>', { value: 3 }, { cache: true, filename: cacheKey });
  assert.strictEqual(third, 'B3');

  return 'PASS: cache and clearCache control compiled template reuse';
};
