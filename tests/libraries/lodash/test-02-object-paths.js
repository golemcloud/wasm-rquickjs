import assert from 'assert';
import _ from 'lodash';

export const run = () => {
  const input = {
    user: {
      profile: {
        name: 'Ada',
      },
      tags: ['admin'],
    },
  };

  _.set(input, 'user.profile.age', 42);
  _.set(input, 'user.tags[1]', 'editor');

  assert.strictEqual(_.get(input, 'user.profile.name'), 'Ada');
  assert.strictEqual(_.get(input, 'user.profile.age'), 42);
  assert.strictEqual(_.get(input, 'user.tags[1]'), 'editor');
  assert.strictEqual(_.get(input, 'user.missing.path', 'fallback'), 'fallback');
  assert.strictEqual(_.has(input, 'user.profile.age'), true);

  _.unset(input, 'user.profile.age');
  assert.strictEqual(_.has(input, 'user.profile.age'), false);

  return 'PASS: deep object path get/set/has/unset works';
};
