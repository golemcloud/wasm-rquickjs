import assert from 'assert';
import { Buffer } from 'node:buffer';
import Joi from 'joi';

export const run = () => {
  const schema = Joi.binary().encoding('base64').min(3).max(16).required();
  const { error, value } = schema.validate('aGVsbG8=');

  assert.ifError(error);
  assert.ok(Buffer.isBuffer(value), 'Expected binary value to be a Buffer');
  assert.strictEqual(value.toString('utf8'), 'hello');

  return 'PASS: binary schema decodes base64 into Buffer values';
};
