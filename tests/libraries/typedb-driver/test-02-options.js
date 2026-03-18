import assert from 'assert';
import { TypeDBOptions } from 'typedb-driver';

export const run = async () => {
  const options = new TypeDBOptions({
    infer: true,
    explain: false,
    parallel: false,
    prefetchSize: 32,
    prefetch: true,
    sessionIdleTimeoutMillis: 4000,
    transactionTimeoutMillis: 5000,
    schemaLockAcquireTimeoutMillis: 6000,
    readAnyReplica: false,
  });

  options.explain = true;
  options.traceInference = false;

  assert.strictEqual(options.infer, true);
  assert.strictEqual(options.explain, true);
  assert.strictEqual(options.parallel, false);
  assert.strictEqual(options.prefetch, true);
  assert.strictEqual(options.prefetchSize, 32);
  assert.strictEqual(options.sessionIdleTimeoutMillis, 4000);
  assert.strictEqual(options.transactionTimeoutMillis, 5000);
  assert.strictEqual(options.schemaLockAcquireTimeoutMillis, 6000);
  assert.strictEqual(options.readAnyReplica, false);

  const proto = options.proto().toObject();
  assert.strictEqual(proto.infer, true);
  assert.strictEqual(proto.explain, true);
  assert.strictEqual(proto.prefetch_size, 32);
  assert.strictEqual(proto.transaction_timeout_millis, 5000);

  return 'PASS: TypeDBOptions getters/setters and protobuf conversion work';
};
