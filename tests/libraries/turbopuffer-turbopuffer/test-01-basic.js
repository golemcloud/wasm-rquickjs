import assert from 'assert';
import Turbopuffer from '@turbopuffer/turbopuffer';

export const run = () => {
  const client = new Turbopuffer({
    apiKey: 'tpuf_test_key',
    region: 'aws-us-east-1',
    timeout: 2_500,
    maxRetries: 2,
    defaultNamespace: 'docs',
  });

  assert.strictEqual(client.baseURL, 'https://aws-us-east-1.turbopuffer.com');
  assert.strictEqual(client.timeout, 2_500);
  assert.strictEqual(client.maxRetries, 2);
  assert.strictEqual(client.defaultNamespace, 'docs');

  const clone = client.withOptions({
    timeout: 9_999,
    maxRetries: 0,
    defaultNamespace: 'books',
  });

  assert.notStrictEqual(clone, client);
  assert.strictEqual(clone.timeout, 9_999);
  assert.strictEqual(clone.maxRetries, 0);
  assert.strictEqual(clone.defaultNamespace, 'books');

  const namespace = clone.namespace('events');
  assert.ok(namespace);
  assert.strictEqual(typeof namespace.query, 'function');
  assert.strictEqual(typeof namespace.write, 'function');

  return 'PASS: Turbopuffer client initialization, cloning, and namespace helpers work';
};
