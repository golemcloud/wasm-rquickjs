import assert from 'assert';
import dotenv from 'dotenv';

export const run = () => {
  const target = { KEEP: 'old', REPLACE: 'old' };
  const source = { REPLACE: 'new', ADD: 'added' };

  const written = dotenv.populate(target, source);

  assert.deepStrictEqual(target, {
    KEEP: 'old',
    REPLACE: 'old',
    ADD: 'added',
  });
  assert.deepStrictEqual(written, { ADD: 'added' });

  const overwritten = dotenv.populate(target, source, { override: true });
  assert.deepStrictEqual(target, {
    KEEP: 'old',
    REPLACE: 'new',
    ADD: 'added',
  });
  assert.deepStrictEqual(overwritten, { REPLACE: 'new', ADD: 'added' });

  return 'PASS: populate respects default no-overwrite and supports override mode';
};
