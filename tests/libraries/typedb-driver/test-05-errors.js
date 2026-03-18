import assert from 'assert';
import { ErrorMessage, TypeDBDriverError } from 'typedb-driver';

export const run = async () => {
  const template = ErrorMessage.Driver.MISSING_DB_NAME;
  const errFromTemplate = new TypeDBDriverError(template);
  assert.strictEqual(errFromTemplate.name, 'TypeDBDriverError');
  assert.strictEqual(errFromTemplate.messageTemplate, template);
  assert.ok(errFromTemplate.message.includes(template.code()));

  const errFromString = new TypeDBDriverError('custom message');
  assert.strictEqual(errFromString.message, 'custom message');

  const errFromError = new TypeDBDriverError(new Error('wrapped boom'));
  assert.ok(errFromError.message.includes('wrapped boom'));

  const formatted = ErrorMessage.Internal.ILLEGAL_ARGUMENT.message('bad-value');
  assert.ok(formatted.includes('bad-value'));
  assert.ok(formatted.includes(ErrorMessage.Internal.ILLEGAL_ARGUMENT.code()));

  return 'PASS: TypeDBDriverError and ErrorMessage formatting behave as expected';
};
