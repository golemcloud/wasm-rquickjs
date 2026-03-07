import assert from 'assert';
import prismaPkg from '@prisma/client';

const { Prisma } = prismaPkg;

export const run = () => {
  const select = Prisma.validator()({ id: true, email: true });
  assert.deepStrictEqual(select, { id: true, email: true });

  const updateData = {
    name: undefined ?? Prisma.skip,
    email: 'alice@example.com',
  };

  assert.strictEqual(updateData.name, Prisma.skip);
  assert.strictEqual(updateData.email, 'alice@example.com');

  return 'PASS: Prisma.validator and Prisma.skip work for shape building';
};
