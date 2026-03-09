import assert from 'assert';
import { IsEmail, Min, IsString, validateSync } from 'class-validator';

class UserInput {
  constructor(email, age, displayName) {
    this.email = email;
    this.age = age;
    this.displayName = displayName;
  }
}

IsEmail()(UserInput.prototype, 'email');
Min(18)(UserInput.prototype, 'age');
IsString()(UserInput.prototype, 'displayName');

export const run = () => {
  const invalid = new UserInput('bad-email', 15, 99);
  const invalidErrors = validateSync(invalid, { forbidUnknownValues: false });
  assert.strictEqual(invalidErrors.length, 3);

  const props = new Set(invalidErrors.map((err) => err.property));
  assert.strictEqual(props.has('email'), true);
  assert.strictEqual(props.has('age'), true);
  assert.strictEqual(props.has('displayName'), true);

  const valid = new UserInput('valid@example.com', 21, 'Alice');
  const validErrors = validateSync(valid, { forbidUnknownValues: false });
  assert.strictEqual(validErrors.length, 0);

  return 'PASS: class-based synchronous validation works';
};
