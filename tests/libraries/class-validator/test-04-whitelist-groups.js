import assert from 'assert';
import { IsString, IsInt, Min, validateSync } from 'class-validator';

class ProfileInput {
  constructor(data) {
    Object.assign(this, data);
  }
}

IsString()(ProfileInput.prototype, 'username');
IsInt({ groups: ['admin'] })(ProfileInput.prototype, 'accessLevel');
Min(1, { groups: ['admin'] })(ProfileInput.prototype, 'accessLevel');

export const run = () => {
  const payload = new ProfileInput({ username: 'alice', accessLevel: 2, injected: 'remove-me' });
  const userErrors = validateSync(payload, {
    whitelist: true,
    groups: ['user'],
    forbidUnknownValues: false,
  });

  assert.strictEqual(userErrors.length, 0);
  assert.strictEqual('injected' in payload, false);
  assert.strictEqual('accessLevel' in payload, false);

  const adminPayload = new ProfileInput({ username: 'admin', accessLevel: 0 });
  const adminErrors = validateSync(adminPayload, {
    groups: ['admin'],
    forbidUnknownValues: false,
  });

  assert.strictEqual(adminErrors.length, 1);
  assert.strictEqual(adminErrors[0].property, 'accessLevel');
  assert.strictEqual(typeof adminErrors[0].constraints.min, 'string');

  return 'PASS: whitelist and validation groups behave correctly';
};
