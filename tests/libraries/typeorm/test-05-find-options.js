import assert from 'assert';
import { FindOptionsUtils } from 'typeorm/index.mjs';

export const run = () => {
  const findOneOptions = {
    where: { id: 1 },
    relations: { profile: true },
    lock: { mode: 'optimistic', version: 1 },
  };

  const findManyOptions = {
    where: { active: true },
    take: 10,
    skip: 5,
    order: { id: 'DESC' },
    join: { alias: 'user' },
  };

  assert.strictEqual(FindOptionsUtils.isFindOneOptions(findOneOptions), true);
  assert.strictEqual(FindOptionsUtils.isFindManyOptions(findManyOptions), true);
  assert.strictEqual(FindOptionsUtils.isFindManyOptions({ random: true }), false);
  assert.strictEqual(FindOptionsUtils.extractFindManyOptionsAlias(findManyOptions), 'user');

  return 'PASS: FindOptionsUtils recognizes and extracts supported option shapes';
};
