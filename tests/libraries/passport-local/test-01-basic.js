import assert from 'assert';
import Strategy from 'passport-local';

export const run = () => {
  const strategy = new Strategy(() => {});
  assert.strictEqual(strategy.name, 'local');
  assert.strictEqual(strategy._usernameField, 'username');
  assert.strictEqual(strategy._passwordField, 'password');

  const strategyWithOptions = new Strategy({ usernameField: 'email', passwordField: 'passcode' }, () => {});
  assert.strictEqual(strategyWithOptions._usernameField, 'email');
  assert.strictEqual(strategyWithOptions._passwordField, 'passcode');

  assert.throws(
    () => new Strategy(),
    (error) => error instanceof TypeError && error.message.includes('LocalStrategy requires a verify callback')
  );

  return 'PASS: Strategy constructor defaults/options and callback validation';
};
