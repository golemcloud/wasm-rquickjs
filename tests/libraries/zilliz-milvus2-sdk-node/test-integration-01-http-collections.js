import assert from 'assert';
import { HttpClient } from '@zilliz/milvus2-sdk-node';

const BASE = 'http://localhost:18080';

export const run = async () => {
  const client = new HttpClient({
    endpoint: BASE,
    token: 'test-token',
  });

  const result = await client.listCollections();
  assert.deepStrictEqual(result.data, ['books', 'docs']);
  assert.strictEqual(result.receivedDbName, 'default');
  assert.strictEqual(result.authHeaderPresent, true);

  return 'PASS: HttpClient listCollections works against mock service';
};
