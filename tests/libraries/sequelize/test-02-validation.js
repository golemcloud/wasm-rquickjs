import assert from 'assert';
import SequelizePkg from 'sequelize';

const { Op, col, fn, cast, where, literal } = SequelizePkg;

export const run = () => {
  assert.strictEqual(typeof Op.eq, 'symbol');
  assert.strictEqual(Op.eq, Symbol.for('eq'));

  const predicate = where(col('age'), Op.gte, 18);
  assert.strictEqual(predicate.comparator, Op.gte);
  assert.strictEqual(predicate.logic, 18);
  assert.strictEqual(predicate.attribute.col, 'age');
  assert.strictEqual(predicate.attribute.constructor.name, 'Col');

  const uppercase = fn('upper', col('username'));
  assert.strictEqual(uppercase.fn, 'upper');
  assert.strictEqual(uppercase.args.length, 1);

  const casted = cast(col('age'), 'INTEGER');
  assert.strictEqual(casted.type, 'INTEGER');

  const rawNow = literal('NOW()');
  assert.strictEqual(rawNow.val, 'NOW()');

  return 'PASS: Op symbols and SQL expression builders are usable';
};
