import assert from 'assert';
import { Metadata, StatusBuilder, compressionAlgorithms, connectivityState, status } from '@grpc/grpc-js';

export const run = () => {
  assert.strictEqual(status.OK, 0);
  assert.strictEqual(status.UNAVAILABLE, 14);
  assert.strictEqual(connectivityState.READY, 2);
  assert.strictEqual(compressionAlgorithms.gzip, 2);

  const metadata = new Metadata();
  metadata.set('x-error-id', 'err-42');

  const built = new StatusBuilder()
    .withCode(status.INVALID_ARGUMENT)
    .withDetails('invalid payload')
    .withMetadata(metadata)
    .build();

  assert.strictEqual(built.code, status.INVALID_ARGUMENT);
  assert.strictEqual(built.details, 'invalid payload');
  assert.strictEqual(built.metadata.get('x-error-id')[0], 'err-42');

  return 'PASS: status enums and StatusBuilder produce expected status objects';
};
