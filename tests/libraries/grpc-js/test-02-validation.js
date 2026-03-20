import assert from 'assert';
import { Metadata } from '@grpc/grpc-js';

export const run = () => {
  const metadata = new Metadata();

  assert.throws(() => metadata.set('Bad Key', 'value'), /metadata key/i);
  assert.throws(() => metadata.set('x-valid', 'line1\nline2'), /metadata/i);
  assert.throws(() => metadata.set('token-bin', 'not-a-buffer'), /must have buffer values/i);
  assert.throws(() => metadata.set('x-text', Buffer.from('abc')), /must have string values/i);

  metadata.set('token-bin', Buffer.from([1, 2, 3]));
  assert.deepStrictEqual(metadata.get('token-bin')[0], Buffer.from([1, 2, 3]));

  return 'PASS: Metadata validation rules enforce key/value/binary constraints';
};
