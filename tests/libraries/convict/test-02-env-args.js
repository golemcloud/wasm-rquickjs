import assert from 'assert';
import convict from 'convict';

export const run = () => {
  const config = convict(
    {
      mode: {
        format: ['development', 'production'],
        default: 'development',
        env: 'APP_MODE',
      },
      port: {
        format: 'port',
        default: 3000,
        env: 'APP_PORT',
        arg: 'port',
      },
    },
    {
      env: { APP_MODE: 'production', APP_PORT: '4100' },
      args: ['--port', '5200'],
    },
  );

  config.validate();

  assert.strictEqual(config.get('mode'), 'production');
  assert.strictEqual(config.get('port'), 5200);

  return 'PASS: env and args overrides are applied with coercion';
};
