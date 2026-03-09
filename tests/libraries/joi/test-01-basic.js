import assert from 'assert';
import Joi from 'joi';

export const run = () => {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(12).required(),
    age: Joi.number().integer().min(18).required(),
    role: Joi.string().valid('admin', 'user').default('user'),
  }).prefs({ convert: true, stripUnknown: true, abortEarly: false });

  const input = {
    username: 'alice01',
    age: '34',
    ignored: 'field',
  };

  const { error, value } = schema.validate(input);
  assert.ifError(error);
  assert.deepStrictEqual(value, {
    username: 'alice01',
    age: 34,
    role: 'user',
  });

  return 'PASS: object validation, coercion, defaults, and stripUnknown';
};
