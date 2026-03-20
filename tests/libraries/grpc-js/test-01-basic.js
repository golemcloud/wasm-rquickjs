import assert from 'assert';
import { Metadata } from '@grpc/grpc-js';

export const run = () => {
  const metadata = new Metadata();
  metadata.set('authorization', 'Bearer token');
  metadata.add('x-trace-id', 'trace-1');
  metadata.add('x-trace-id', 'trace-2');

  assert.deepStrictEqual(metadata.get('authorization'), ['Bearer token']);
  assert.deepStrictEqual(metadata.get('x-trace-id'), ['trace-1', 'trace-2']);

  const clone = metadata.clone();
  clone.set('user-agent', 'grpc-js-test');

  assert.strictEqual(metadata.get('user-agent').length, 0);
  assert.strictEqual(clone.getMap()['authorization'], 'Bearer token');

  return 'PASS: Metadata set/add/get/clone operations work';
};
