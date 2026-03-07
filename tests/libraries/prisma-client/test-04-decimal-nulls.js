import assert from 'assert';
import prismaPkg from '@prisma/client';

const { Prisma } = prismaPkg;

export const run = () => {
  const value = new Prisma.Decimal('1.25').plus('2.75');
  assert.strictEqual(value.toString(), '4');

  assert.ok(Prisma.DbNull);
  assert.ok(Prisma.JsonNull);
  assert.ok(Prisma.AnyNull);
  assert.notStrictEqual(Prisma.DbNull, Prisma.JsonNull);
  assert.notStrictEqual(Prisma.JsonNull, Prisma.AnyNull);

  return 'PASS: Prisma.Decimal and null sentinels are available';
};
