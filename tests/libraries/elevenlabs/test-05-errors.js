import assert from 'assert';
import { ElevenLabsError, ElevenLabsTimeoutError } from 'elevenlabs';

export const run = () => {
  const detailedError = new ElevenLabsError({
    message: 'Request failed',
    statusCode: 422,
    body: { detail: 'unprocessable', code: 'invalid_request' },
  });

  assert.ok(detailedError instanceof Error);
  assert.strictEqual(detailedError.statusCode, 422);
  assert.deepStrictEqual(detailedError.body, { detail: 'unprocessable', code: 'invalid_request' });
  assert.match(detailedError.message, /Request failed/);
  assert.match(detailedError.message, /Status code: 422/);
  assert.match(detailedError.message, /invalid_request/);

  const timeoutError = new ElevenLabsTimeoutError('request timeout');
  assert.ok(timeoutError instanceof Error);
  assert.strictEqual(timeoutError.message, 'request timeout');

  return 'PASS: ElevenLabs error classes expose expected fields and messages';
};
