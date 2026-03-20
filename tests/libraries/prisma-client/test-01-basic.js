import assert from 'assert';
import prismaPkg from '@prisma/client';

const { Prisma } = prismaPkg;

export const run = () => {
  const query = Prisma.sql`SELECT * FROM users WHERE id = ${42} AND active = ${true}`;

  assert.strictEqual(query.values.length, 2);
  assert.strictEqual(query.values[0], 42);
  assert.strictEqual(query.values[1], true);
  assert.strictEqual(typeof query.sql, 'string');
  assert.strictEqual(typeof query.text, 'string');

  return 'PASS: Prisma.sql builds parameterized SQL fragments';
};
