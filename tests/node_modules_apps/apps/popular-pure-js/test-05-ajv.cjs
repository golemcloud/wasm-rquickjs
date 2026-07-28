const assert = require('node:assert');
const Ajv = require('ajv');

exports.run = () => {
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile({
    type: 'object',
    required: ['name', 'count'],
    properties: {
      name: { type: 'string', minLength: 2 },
      count: { type: 'integer', minimum: 1 },
    },
    additionalProperties: false,
  });
  assert.strictEqual(validate({ name: 'ok', count: 2 }), true);
  assert.strictEqual(validate({ name: 'x', count: 0, extra: true }), false);
  assert(validate.errors.length >= 2);
  return 'PASS: ajv compiles and runs schemas from installed CommonJS package graph';
};
