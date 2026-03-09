import assert from 'assert';
import Joi from 'joi';

export const run = () => {
  const schema = Joi.compile({
    id: Joi.alternatives().try(Joi.number().integer(), Joi.string().guid({ version: 'uuidv4' })).required(),
    tags: Joi.array().items(Joi.string().min(2)).single().default([]),
  });

  const numeric = schema.validate({ id: 42, tags: 'ok' });
  assert.ifError(numeric.error);
  assert.deepStrictEqual(numeric.value, { id: 42, tags: ['ok'] });

  const uuid = schema.validate({ id: '550e8400-e29b-41d4-a716-446655440000' });
  assert.ifError(uuid.error);
  assert.deepStrictEqual(uuid.value.tags, []);

  const invalid = schema.validate({ id: true });
  assert.ok(invalid.error, 'Expected invalid alternatives input to fail');

  return 'PASS: compile and alternatives schemas validate mixed input forms';
};
