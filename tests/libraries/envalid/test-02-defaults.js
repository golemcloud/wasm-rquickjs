import assert from 'assert';
import { bool, cleanEnv, num, str, testOnly } from 'envalid';

export const run = () => {
  const schema = {
    NODE_ENV: str({ choices: ['development', 'test', 'production'] }),
    PORT: num(),
    FEATURE_X: bool({ devDefault: true }),
    CACHE_TTL: num({ default: 120 }),
  };

  const developmentEnv = cleanEnv({
    NODE_ENV: 'development',
    PORT: '3000',
  }, schema);
  assert.strictEqual(developmentEnv.FEATURE_X, true);
  assert.strictEqual(developmentEnv.CACHE_TTL, 120);

  const productionEnv = cleanEnv({
    NODE_ENV: 'production',
    PORT: '3000',
    FEATURE_X: 'false',
  }, schema);
  assert.strictEqual(productionEnv.FEATURE_X, false);
  assert.strictEqual(productionEnv.CACHE_TTL, 120);

  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  try {
    const testEnv = cleanEnv({
      NODE_ENV: 'test',
    }, {
      NODE_ENV: str({ choices: ['test'] }),
      TEST_SECRET: str({ devDefault: testOnly('mock-secret') }),
    });
    assert.strictEqual(testEnv.TEST_SECRET, 'mock-secret');
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }

  return 'PASS: default, devDefault, and testOnly semantics behave correctly';
};
