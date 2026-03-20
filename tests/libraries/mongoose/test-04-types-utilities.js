import assert from 'assert';
import mongoose from 'mongoose';

export const run = () => {
  const objectId = new mongoose.Types.ObjectId();
  assert.strictEqual(mongoose.isValidObjectId(objectId), true);
  assert.strictEqual(mongoose.isObjectIdOrHexString(objectId.toHexString()), true);

  const filter = { age: { $gt: 10 }, password: { $ne: null } };
  mongoose.sanitizeFilter(filter);
  assert.deepStrictEqual(filter.password, { $eq: { $ne: null } });

  const pruned = mongoose.omitUndefined({ active: true, nick: undefined });
  assert.deepStrictEqual(pruned, { active: true });

  const decimal = mongoose.Types.Decimal128.fromString('3.14');
  assert.strictEqual(decimal.toString(), '3.14');

  return 'PASS: object id helpers and utility APIs work';
};
