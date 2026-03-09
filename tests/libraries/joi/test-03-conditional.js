import assert from 'assert';
import Joi from 'joi';

export const run = () => {
  const schema = Joi.object({
    kind: Joi.string().valid('percent', 'fixed').required(),
    value: Joi.number().when('kind', {
      is: 'percent',
      then: Joi.number().min(0).max(100).required(),
      otherwise: Joi.number().greater(0).required(),
    }),
  });

  const percent = schema.validate({ kind: 'percent', value: 80 });
  assert.ifError(percent.error);

  const fixed = schema.validate({ kind: 'fixed', value: 5 });
  assert.ifError(fixed.error);

  const invalid = schema.validate({ kind: 'percent', value: 120 });
  assert.ok(invalid.error, 'Expected percent value > 100 to fail');
  assert.strictEqual(invalid.error.details[0].type, 'number.max');

  return 'PASS: conditional schemas with references work';
};
