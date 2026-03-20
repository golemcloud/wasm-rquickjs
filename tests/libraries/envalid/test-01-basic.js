import assert from 'assert';
import { bool, cleanEnv, email, json, num, str, url } from 'envalid';

export const run = () => {
  const env = cleanEnv({
    APP_NAME: 'worker',
    PORT: '8080',
    DEBUG: 'true',
    ADMIN_EMAIL: 'admin@example.com',
    BASE_URL: 'https://example.com/api',
    FLAGS: '{"retries":3,"safeMode":false}',
  }, {
    APP_NAME: str(),
    PORT: num(),
    DEBUG: bool(),
    ADMIN_EMAIL: email(),
    BASE_URL: url(),
    FLAGS: json(),
    MODE: str({ choices: ['dev', 'prod'], default: 'dev' }),
  });

  assert.strictEqual(env.APP_NAME, 'worker');
  assert.strictEqual(env.PORT, 8080);
  assert.strictEqual(env.DEBUG, true);
  assert.strictEqual(env.ADMIN_EMAIL, 'admin@example.com');
  assert.strictEqual(env.BASE_URL, 'https://example.com/api');
  assert.deepStrictEqual(env.FLAGS, { retries: 3, safeMode: false });
  assert.strictEqual(env.MODE, 'dev');

  return 'PASS: cleanEnv parses built-in validators and defaults';
};
