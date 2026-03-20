import assert from 'assert';
import {
  isEmail,
  isUUID,
  isInt,
  isISO8601,
  isIP,
  isStrongPassword,
} from 'class-validator';

export const run = () => {
  assert.strictEqual(isEmail('alice@example.com'), true);
  assert.strictEqual(isEmail('alice.example.com'), false);

  assert.strictEqual(isUUID('550e8400-e29b-41d4-a716-446655440000'), true);
  assert.strictEqual(isUUID('not-a-uuid'), false);

  assert.strictEqual(isInt(42), true);
  assert.strictEqual(isInt(3.14), false);

  assert.strictEqual(isISO8601('2026-03-09T10:11:12Z'), true);
  assert.strictEqual(isIP('127.0.0.1', 4), true);

  assert.strictEqual(
    isStrongPassword('AstrongP@ssw0rd', { minLength: 10, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 }),
    true,
  );

  return 'PASS: standalone validator functions work';
};
