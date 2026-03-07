import assert from 'assert';
import { DefaultNamingStrategy } from 'typeorm/index.mjs';

export const run = () => {
  const naming = new DefaultNamingStrategy();

  assert.strictEqual(naming.tableName('UserProfile', undefined), 'user_profile');
  assert.strictEqual(naming.tableName('UserProfile', 'members'), 'members');

  assert.strictEqual(naming.columnName('displayName', 'custom', []), 'custom');
  assert.strictEqual(naming.columnName('displayName', undefined, ['profile']), 'profileDisplayname');

  assert.strictEqual(naming.joinColumnName('user', 'id'), 'userId');
  assert.strictEqual(
    naming.joinTableName('user_profile', 'roles', 'roles', 'userId', 'roleId'),
    'user_profile_roles_roles',
  );
  assert.strictEqual(naming.joinTableColumnName('user_profile', 'id', 'userId'), 'userProfileUserId');
  assert.strictEqual(naming.relationName('displayName'), 'displayName');

  return 'PASS: DefaultNamingStrategy produces stable table and join names';
};
