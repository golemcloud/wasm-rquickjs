import assert from 'assert';
import { EnvError, cleanEnv, makeValidator, str } from 'envalid';

const positiveInt = makeValidator((value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new EnvError(`expected a positive integer, got ${value}`);
  }
  return parsed;
});

export const run = () => {
  const env = cleanEnv({
    RETRY_COUNT: '3',
    REGION: 'eu-west-1',
  }, {
    RETRY_COUNT: positiveInt({ choices: [1, 2, 3, 5] }),
    REGION: str({ choices: ['us-east-1', 'eu-west-1'] }),
  });

  assert.strictEqual(env.RETRY_COUNT, 3);
  assert.strictEqual(env.REGION, 'eu-west-1');

  assert.throws(() => cleanEnv({ RETRY_COUNT: '-1' }, {
    RETRY_COUNT: positiveInt(),
  }, { reporter: null }), /expected a positive integer/);

  return 'PASS: makeValidator supports custom parsing and validation failures';
};
