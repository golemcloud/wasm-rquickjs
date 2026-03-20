import assert from 'assert';
import convict from 'convict';

export const run = () => {
  const config = convict(
    {
      retries: { format: 'nat', default: 2 },
      featureEnabled: { format: Boolean, default: false },
    },
    { env: {}, args: [] },
  );

  config.load({ retries: 4, featureEnabled: true });
  config.validate({ allowed: 'strict' });

  config.load({ extraOption: true });

  let threwForUndeclaredKey = false;
  try {
    config.validate({ allowed: 'strict' });
  } catch (error) {
    threwForUndeclaredKey = String(error.message).includes('not declared in the schema');
  }

  assert.strictEqual(threwForUndeclaredKey, true);
  return 'PASS: strict validation rejects undeclared keys';
};
