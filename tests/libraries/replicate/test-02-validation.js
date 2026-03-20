import assert from 'assert';
import Replicate from 'replicate';

export const run = async () => {
  const client = new Replicate({ auth: 'r8_test_token', fetch: async () => {
    throw new Error('fetch should not be called for invalid input');
  } });

  let runError = null;
  try {
    await client.run('bad-model-ref', { input: { prompt: 'hello' } });
  } catch (error) {
    runError = error;
  }
  assert.ok(runError);
  assert.match(runError.message, /Invalid reference to model version/);

  let webhookError = null;
  try {
    await client.predictions.create({
      version: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      input: { prompt: 'hello' },
      webhook: 'not-a-valid-url',
    });
  } catch (error) {
    webhookError = error;
  }

  assert.ok(webhookError);
  assert.match(webhookError.message, /Invalid webhook URL/);

  return 'PASS: Replicate validates model references and webhook URLs';
};
