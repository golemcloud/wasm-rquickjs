import assert from 'assert';
import prismaPkg from '@prisma/client';

const { Prisma } = prismaPkg;

export const run = () => {
  const whereClause = Prisma.join(
    [
      Prisma.sql`name = ${'Alice'}`,
      Prisma.sql`age > ${18}`,
    ],
    ' AND '
  );

  const query = Prisma.sql`SELECT * FROM users WHERE ${whereClause} ${Prisma.empty}`;
  const rawQuery = Prisma.sql`SELECT ${Prisma.raw('1')}`;

  assert.strictEqual(query.values.length, 2);
  assert.ok(query.sql.includes('AND'));
  assert.strictEqual(rawQuery.sql, 'SELECT 1');

  return 'PASS: Prisma.join/raw/empty compose SQL fragments';
};
