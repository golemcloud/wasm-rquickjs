import assert from 'assert';
import {
  DeepgramEnvironment,
  DeepgramError,
  DeepgramTimeoutError,
} from '@deepgram/sdk';

export const run = () => {
  assert.strictEqual(DeepgramEnvironment.Production.base, 'https://api.deepgram.com');
  assert.strictEqual(DeepgramEnvironment.Production.agent, 'wss://agent.deepgram.com');
  assert.strictEqual(DeepgramEnvironment.Agent.base, 'https://agent.deepgram.com');

  const err = new DeepgramError({
    message: 'request failed',
    statusCode: 429,
    body: { err_code: 'rate_limit', err_msg: 'too many requests' },
  });
  assert.ok(err.message.includes('request failed'));
  assert.ok(err.message.includes('Status code: 429'));
  assert.ok(err.message.includes('rate_limit'));
  assert.strictEqual(err.statusCode, 429);

  const timeoutErr = new DeepgramTimeoutError('request timed out');
  assert.ok(timeoutErr instanceof Error);
  assert.strictEqual(timeoutErr.name, 'DeepgramTimeoutError');

  return 'PASS: environment constants and error class behavior';
};
