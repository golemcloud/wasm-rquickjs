import assert from 'assert';
import Joi from 'joi';

export const run = () => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  }).prefs({ abortEarly: false });

  const { error } = schema.validate({
    email: 'invalid-email',
    password: '123',
  });

  assert.ok(error, 'Expected validation to fail');
  const errorTypes = error.details.map((detail) => detail.type).sort();
  assert.deepStrictEqual(errorTypes, ['string.email', 'string.min']);

  return 'PASS: validation errors include all failing fields when abortEarly=false';
};
