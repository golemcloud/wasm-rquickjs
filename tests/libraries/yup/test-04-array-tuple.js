import assert from 'assert';
import { array, number, string, tuple } from 'yup';

export const run = () => {
  const tagsSchema = array()
    .of(string().trim().min(2))
    .compact((value) => value == null || value === '')
    .min(2)
    .max(4);

  const tags = tagsSchema.validateSync(['  red  ', '', null, 'blue']);
  assert.deepStrictEqual(tags, ['red', 'blue']);

  const pointSchema = tuple([
    number().required().integer(),
    number().required().integer(),
  ]);
  const point = pointSchema.validateSync([3, 4]);
  assert.deepStrictEqual(point, [3, 4]);

  let tupleErr;
  try {
    pointSchema.validateSync([3]);
  } catch (e) {
    tupleErr = e;
  }
  assert.ok(tupleErr, 'expected tuple length validation error');

  return 'PASS: array transforms and tuple positional validation work';
};
