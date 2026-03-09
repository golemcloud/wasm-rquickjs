import assert from 'assert';
import { Validate, ValidatorConstraint, validate } from 'class-validator';

class StartsWithPrefixConstraint {
  async validate(value) {
    await Promise.resolve();
    return typeof value === 'string' && value.startsWith('go-');
  }

  defaultMessage() {
    return 'name must start with go-';
  }
}

ValidatorConstraint({ name: 'startsWithPrefix', async: true })(StartsWithPrefixConstraint);

class AsyncInput {
  constructor(name) {
    this.name = name;
  }
}

Validate(StartsWithPrefixConstraint)(AsyncInput.prototype, 'name');

export const run = async () => {
  const invalid = new AsyncInput('invalid');
  const invalidErrors = await validate(invalid, { forbidUnknownValues: false });
  assert.strictEqual(invalidErrors.length, 1);
  assert.strictEqual(invalidErrors[0].property, 'name');
  assert.strictEqual(invalidErrors[0].constraints.startsWithPrefix, 'name must start with go-');

  const valid = new AsyncInput('go-runtime');
  const validErrors = await validate(valid, { forbidUnknownValues: false });
  assert.strictEqual(validErrors.length, 0);

  return 'PASS: async custom validator constraint works';
};
