import assert from 'assert';
import { cleanEnv, str } from 'envalid';

export const run = () => {
  const env = cleanEnv({
    NODE_ENV: 'production',
    API_KEY: 'secret',
  }, {
    NODE_ENV: str({ choices: ['development', 'test', 'production'] }),
    API_KEY: str(),
  });

  assert.strictEqual(env.isProduction, true);
  assert.strictEqual(env.isProd, true);
  assert.strictEqual(env.isDev, false);
  assert.strictEqual(env.isTest, false);

  assert.throws(() => env.UNDECLARED_KEY, ReferenceError);
  assert.throws(() => {
    env.API_KEY = 'changed';
  }, TypeError);

  return 'PASS: strict proxy blocks unknown vars and mutations';
};
