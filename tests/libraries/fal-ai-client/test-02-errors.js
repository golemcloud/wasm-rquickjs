import assert from 'assert';
import { ApiError, ValidationError, isRetryableError } from '@fal-ai/client';

export const run = () => {
  const retryable = new ApiError({
    message: 'Rate limited',
    status: 429,
    body: { message: 'Rate limited' },
    requestId: 'req-retry',
  });

  const userTimeout = new ApiError({
    message: 'Timed out',
    status: 504,
    body: { message: 'Timed out' },
    requestId: 'req-timeout',
    timeoutType: 'user',
  });

  assert.strictEqual(isRetryableError(retryable, [429, 503, 504]), true);
  assert.strictEqual(isRetryableError(userTimeout, [429, 503, 504]), false);
  assert.strictEqual(userTimeout.isUserTimeout, true);

  const validationError = new ValidationError({
    message: 'Validation failed',
    status: 422,
    body: {
      detail: [
        { loc: ['body', 'prompt'], msg: 'Field required', type: 'missing' },
      ],
    },
    requestId: 'req-validation',
  });

  assert.strictEqual(validationError.fieldErrors.length, 1);
  assert.strictEqual(validationError.getFieldErrors('prompt').length, 1);
  assert.strictEqual(validationError.getFieldErrors('model').length, 0);

  const messageValidationError = new ValidationError({
    message: 'Validation failed',
    status: 422,
    body: { detail: 'Prompt too short' },
    requestId: 'req-validation-text',
  });

  assert.deepStrictEqual(messageValidationError.fieldErrors, [
    {
      loc: ['body'],
      msg: 'Prompt too short',
      type: 'value_error',
    },
  ]);

  return 'PASS: ApiError/ValidationError and retryability helpers behave as expected';
};
