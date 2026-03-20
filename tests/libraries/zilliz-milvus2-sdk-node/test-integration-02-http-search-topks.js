import assert from 'assert';
import { HttpClient } from '@zilliz/milvus2-sdk-node';

const BASE = 'http://localhost:18080';

export const run = async () => {
  const client = new HttpClient({
    endpoint: BASE,
    token: 'test-token',
  });

  const result = await client.search({
    collectionName: 'books',
    data: [[0.1, 0.2, 0.3]],
  });

  assert.strictEqual(result.receivedDbName, 'default');
  assert.strictEqual(result.echoedCollection, 'books');
  assert.strictEqual(Array.isArray(result.data), true);
  assert.strictEqual(result.data.length, 2);
  assert.strictEqual(result.data[0].length, 2);
  assert.strictEqual(result.data[1].length, 1);
  assert.strictEqual(result.data[1][0].id, 2);

  return 'PASS: HttpClient search topks splitting works against mock service';
};
