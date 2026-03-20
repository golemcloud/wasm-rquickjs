import assert from 'assert';
import {
  Any,
  Between,
  Equal,
  ILike,
  In,
  InstanceChecker,
  IsNull,
  Not,
  Raw,
} from 'typeorm/index.mjs';

export const run = () => {
  const inOperator = In([1, 2, 3]);
  const notOperator = Not(Equal(10));
  const betweenOperator = Between(3, 9);
  const likeOperator = ILike('%admin%');
  const isNullOperator = IsNull();
  const rawOperator = Raw((alias) => `${alias} > :min`, { min: 7 });
  const anyOperator = Any(['a', 'b']);

  assert.strictEqual(inOperator.type, 'in');
  assert.strictEqual(inOperator.multipleParameters, true);
  assert.deepStrictEqual(inOperator.value, [1, 2, 3]);

  assert.strictEqual(notOperator.type, 'not');
  assert.strictEqual(betweenOperator.type, 'between');
  assert.strictEqual(likeOperator.type, 'ilike');
  assert.strictEqual(isNullOperator.type, 'isNull');
  assert.strictEqual(rawOperator.type, 'raw');
  assert.deepStrictEqual(rawOperator.objectLiteralParameters, { min: 7 });
  assert.strictEqual(anyOperator.type, 'any');

  assert.strictEqual(InstanceChecker.isFindOperator(inOperator), true);
  assert.strictEqual(InstanceChecker.isFindOperator(rawOperator), true);
  assert.strictEqual(InstanceChecker.isFindOperator({ type: 'in' }), false);

  return 'PASS: Find operators expose expected metadata and instance checks';
};
