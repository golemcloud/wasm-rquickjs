import assert from 'assert';
import { boolean, number, object, string } from 'yup';

export const run = () => {
  const schema = object({
    name: string().required().min(2).trim(),
    age: number().required().integer().min(18),
    email: string().required().email(),
    subscribed: boolean().default(false),
  });

  const value = schema.validateSync(
    {
      name: '  Alice  ',
      age: '29',
      email: 'alice@example.com',
      extra: 'drop-me',
    },
    { stripUnknown: true }
  );

  assert.deepStrictEqual(value, {
    name: 'Alice',
    age: 29,
    email: 'alice@example.com',
    subscribed: false,
  });

  return 'PASS: basic object validation with coercion, defaults, and stripUnknown';
};
