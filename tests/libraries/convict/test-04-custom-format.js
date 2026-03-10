import assert from 'assert';
import convict from 'convict';

convict.addFormat({
  name: 'cfg-id',
  validate: (value) => {
    if (typeof value !== 'string' || !value.startsWith('cfg-')) {
      throw new Error('must start with cfg-');
    }
  },
  coerce: (value) => String(value).trim(),
});

export const run = () => {
  const config = convict(
    {
      configId: {
        format: 'cfg-id',
        default: 'cfg-default',
        env: 'CONFIG_ID',
      },
      apiKey: {
        format: String,
        default: 'super-secret-token',
        sensitive: true,
      },
    },
    { env: { CONFIG_ID: '   cfg-from-env   ' }, args: [] },
  );

  config.validate();

  assert.strictEqual(config.get('configId'), 'cfg-from-env');

  const serialized = JSON.parse(config.toString());
  assert.strictEqual(serialized.apiKey, '[Sensitive]');

  config.set('configId', 'invalid-id');

  let threwForInvalidFormat = false;
  try {
    config.validate();
  } catch (error) {
    threwForInvalidFormat = String(error.message).includes('must start with cfg-');
  }

  assert.strictEqual(threwForInvalidFormat, true);
  return 'PASS: custom format and sensitive masking work';
};
