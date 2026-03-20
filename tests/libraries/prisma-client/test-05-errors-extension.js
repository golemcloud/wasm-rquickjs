import assert from 'assert';
import prismaPkg from '@prisma/client';

const { Prisma } = prismaPkg;

export const run = () => {
  const known = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test-version',
    meta: { target: ['email'] },
  });
  assert.strictEqual(known.code, 'P2002');
  assert.strictEqual(known.clientVersion, 'test-version');

  const init = new Prisma.PrismaClientInitializationError('Init failed', 'test-version');
  assert.strictEqual(init.clientVersion, 'test-version');

  const extension = Prisma.defineExtension({
    name: 'test-extension',
    client: {
      ping() {
        return 'pong';
      },
    },
  });

  assert.strictEqual(typeof extension, 'function');

  return 'PASS: Prisma error classes and defineExtension are usable';
};
