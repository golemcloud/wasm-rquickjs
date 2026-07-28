const assert = require('node:assert');
const Joi = require('joi');
const yup = require('yup');

exports.run = async () => {
  const joiSchema = Joi.object({ name: Joi.string().min(2).required(), count: Joi.number().integer().min(1).required() });
  assert.deepStrictEqual(joiSchema.validate({ name: 'ok', count: 3 }).value, { name: 'ok', count: 3 });
  assert(joiSchema.validate({ name: 'x', count: 0 }).error);

  const yupSchema = yup.object({ name: yup.string().required(), count: yup.number().min(1).required() });
  assert.deepStrictEqual(await yupSchema.validate({ name: 'ok', count: 3 }), { name: 'ok', count: 3 });
  await assert.rejects(() => yupSchema.validate({ name: '', count: 0 }));
  return 'PASS: joi and yup validation packages execute from node_modules';
};
