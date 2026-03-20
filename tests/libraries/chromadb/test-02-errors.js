import assert from 'assert';
import {
  ChromaForbiddenError,
  ChromaNotFoundError,
  ChromaQuotaExceededError,
  ChromaRateLimitError,
  ChromaUnauthorizedError,
  ChromaUniqueError,
  ChromaValueError,
  InvalidArgumentError,
  InvalidCollectionError,
  createErrorByType,
} from 'chromadb';

export const run = () => {
  const cause = new Error('root cause');

  const forbidden = new ChromaForbiddenError('forbidden', cause);
  assert.strictEqual(forbidden.name, 'ChromaForbiddenError');
  assert.strictEqual(forbidden.cause, cause);

  const notFound = new ChromaNotFoundError('not found');
  assert.strictEqual(notFound.name, 'ChromaNotFoundError');

  const unauthorized = new ChromaUnauthorizedError('unauthorized');
  assert.ok(
    unauthorized.name === 'ChromaUnauthorizedError' || unauthorized.name === 'ChromaAuthError',
  );

  const unique = new ChromaUniqueError('duplicate');
  assert.strictEqual(unique.name, 'ChromaUniqueError');

  const quota = new ChromaQuotaExceededError('quota');
  assert.strictEqual(quota.name, 'ChromaQuotaExceededError');

  const rate = new ChromaRateLimitError('rate');
  assert.strictEqual(rate.name, 'ChromaRateLimitError');

  const valueError = new ChromaValueError('bad value');
  assert.strictEqual(valueError.name, 'ChromaValueError');

  const invalidCollection = createErrorByType('InvalidCollection', 'bad collection');
  assert.ok(invalidCollection instanceof InvalidCollectionError);

  const invalidArgument = createErrorByType('InvalidArgumentError', 'bad arg');
  assert.ok(invalidArgument instanceof InvalidArgumentError);

  assert.strictEqual(createErrorByType('UnknownType', 'x'), undefined);

  return 'PASS: exported error classes and createErrorByType mapping are correct';
};
