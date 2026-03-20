import assert from 'assert';
import convict from 'convict';

export const run = () => {
  const config = convict(
    {
      appName: { format: String, default: 'demo-app' },
      env: { format: ['development', 'test', 'production'], default: 'development' },
      db: {
        host: { format: String, default: 'localhost' },
        port: { format: 'port', default: 5432 },
      },
    },
    { env: {}, args: [] },
  );

  config.validate();

  assert.strictEqual(config.get('appName'), 'demo-app');
  assert.strictEqual(config.get('db.host'), 'localhost');
  assert.strictEqual(config.get('db.port'), 5432);
  assert.strictEqual(config.has('db.host'), true);
  assert.strictEqual(config.has('db.missing'), false);

  return 'PASS: basic defaults and nested access work';
};
