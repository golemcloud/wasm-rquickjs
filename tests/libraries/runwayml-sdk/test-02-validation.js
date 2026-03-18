import assert from 'node:assert';
import RunwayML from '@runwayml/sdk';

export const run = () => {
  const previous = process.env.RUNWAYML_API_SECRET;
  delete process.env.RUNWAYML_API_SECRET;

  try {
    assert.throws(
      () => new RunwayML(),
      (error) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /RUNWAYML_API_SECRET/i);
        return true;
      },
      'constructor should require explicit apiKey or RUNWAYML_API_SECRET'
    );

    process.env.RUNWAYML_API_SECRET = 'rk_env_secret';
    const envClient = new RunwayML();
    assert.strictEqual(envClient.apiKey, 'rk_env_secret');

    const cloned = envClient.withOptions({
      baseURL: 'http://localhost:18080',
      maxRetries: 0,
    });

    assert.notStrictEqual(cloned, envClient);
    assert.strictEqual(cloned.baseURL, 'http://localhost:18080');
    assert.strictEqual(cloned.maxRetries, 0);
    assert.strictEqual(cloned.apiKey, 'rk_env_secret');
  } finally {
    if (previous === undefined) {
      delete process.env.RUNWAYML_API_SECRET;
    } else {
      process.env.RUNWAYML_API_SECRET = previous;
    }
  }

  return 'PASS: api key validation, env fallback, and withOptions cloning behave as expected';
};
