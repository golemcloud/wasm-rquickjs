import assert from 'assert';
import { HttpClient, HttpError } from '@zilliz/milvus2-sdk-node';

const BASE = 'http://localhost:18080';

export const run = async () => {
  const client = new HttpClient({
    endpoint: BASE,
    token: 'test-token',
  });

  try {
    await client.describeCollection({ collectionName: 'missing' });
    throw new Error('Expected describeCollection to throw HttpError');
  } catch (error) {
    assert.ok(error instanceof HttpError);
    assert.strictEqual(error.status, 500);
    assert.strictEqual(error.statusText, 'Internal Server Error');
    assert.match(error.message, /collection does not exist/);
  }

  return 'PASS: HttpClient propagates HTTP failures as HttpError';
};
