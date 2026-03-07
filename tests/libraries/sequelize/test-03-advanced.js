import assert from 'assert';
import SequelizePkg from 'sequelize';

const {
  ValidationError,
  ValidationErrorItem,
  UniqueConstraintError,
  ConnectionError,
  DatabaseError,
} = SequelizePkg;

export const run = () => {
  const item = new ValidationErrorItem('name is required', 'Validation error', 'name', null, null, null);
  const validationError = new ValidationError('Invalid user payload', [item]);

  assert.ok(validationError instanceof Error);
  assert.ok(validationError instanceof ValidationError);
  assert.strictEqual(validationError.errors.length, 1);
  assert.strictEqual(validationError.errors[0].path, 'name');

  const uniqueError = new UniqueConstraintError({ message: 'Duplicate email' });
  assert.ok(uniqueError instanceof ValidationError);
  assert.strictEqual(uniqueError.message, 'Duplicate email');

  const connectionError = new ConnectionError(new Error('ECONNREFUSED'));
  assert.ok(connectionError instanceof Error);

  const databaseError = new DatabaseError(new Error('syntax error'));
  assert.ok(databaseError instanceof Error);

  return 'PASS: Sequelize error hierarchy constructs and preserves inheritance';
};
