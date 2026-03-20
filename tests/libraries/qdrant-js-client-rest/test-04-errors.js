import assert from 'node:assert';
import {
  QdrantClientResourceExhaustedError,
  QdrantClientTimeoutError,
  QdrantClientUnexpectedResponseError,
} from '@qdrant/js-client-rest';

export const run = () => {
  const timeoutError = new QdrantClientTimeoutError('operation timed out');
  assert.strictEqual(timeoutError.name, 'QdrantClientTimeoutError');
  assert.strictEqual(timeoutError.message, 'operation timed out');

  const exhaustedError = new QdrantClientResourceExhaustedError('rate limited', '7');
  assert.strictEqual(exhaustedError.name, 'QdrantClientResourceExhaustedError');
  assert.strictEqual(exhaustedError.retry_after, 7);

  const response = new Response(JSON.stringify({ status: 'error' }), {
    status: 500,
    statusText: 'Internal Server Error',
  });
  const unexpectedError = QdrantClientUnexpectedResponseError.forResponse(response);
  assert.strictEqual(unexpectedError.name, 'QdrantClientUnexpectedResponseError');
  assert.match(unexpectedError.message, /500/);

  return 'PASS: exported error classes preserve metadata and messages';
};
