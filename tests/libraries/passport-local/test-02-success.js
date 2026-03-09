import assert from 'assert';
import Strategy from 'passport-local';

export const run = () => {
  const strategy = new Strategy((username, password, done) => {
    assert.strictEqual(username, 'alice');
    assert.strictEqual(password, 's3cret');
    done(null, { id: 42, username }, { scope: 'admin' });
  });

  let successCall;
  strategy.success = (user, info) => {
    successCall = { user, info };
  };
  strategy.fail = () => {
    throw new Error('strategy.fail should not be called for valid credentials');
  };
  strategy.error = (error) => {
    throw error;
  };

  strategy.authenticate({ body: { username: 'alice', password: 's3cret' } });

  assert.deepStrictEqual(successCall, {
    user: { id: 42, username: 'alice' },
    info: { scope: 'admin' },
  });

  return 'PASS: authenticate() routes successful verify callback to success()';
};
