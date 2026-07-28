import assert from 'node:assert';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { GetObjectCommand, PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');

export const run = () => {
  const client = new S3Client({
    region: 'us-east-1',
    endpoint: 'https://example.invalid',
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  });
  assert.strictEqual(typeof client.send, 'function');

  const put = new PutObjectCommand({ Bucket: 'bucket', Key: 'key', Body: 'body' });
  assert.strictEqual(put.input.Bucket, 'bucket');
  assert.strictEqual(put.input.Key, 'key');

  const get = new GetObjectCommand({ Bucket: 'bucket', Key: 'key' });
  assert.deepStrictEqual(get.input, { Bucket: 'bucket', Key: 'key' });
  return 'PASS: AWS S3 SDK command construction works from installed node_modules';
};
