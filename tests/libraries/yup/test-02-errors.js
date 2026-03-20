import assert from 'assert';
import { array, number, object, string, ValidationError } from 'yup';

export const run = () => {
  const schema = object({
    username: string().required().min(4),
    age: number().required().min(18),
    tags: array().of(string().required().min(3)).min(2),
  });

  let err;
  try {
    schema.validateSync(
      {
        username: 'ab',
        age: 16,
        tags: ['x'],
      },
      { abortEarly: false }
    );
  } catch (e) {
    err = e;
  }

  assert.ok(err instanceof ValidationError, 'expected ValidationError');
  assert.ok(err.inner.length >= 3, `expected multiple errors, got ${err.inner.length}`);

  const paths = new Set(err.inner.map((item) => item.path));
  assert.ok(paths.has('username'));
  assert.ok(paths.has('age'));

  return 'PASS: abortEarly=false collects multiple detailed validation errors';
};
