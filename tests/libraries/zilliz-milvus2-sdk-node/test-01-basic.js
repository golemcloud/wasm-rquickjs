import assert from 'assert';
import {
  DataType,
  ErrorCode,
  HttpClient,
  MilvusClient,
} from '@zilliz/milvus2-sdk-node';

export const run = () => {
  const grpcClient = new MilvusClient({
    address: 'localhost:19530',
    __SKIP_CONNECT__: true,
  });

  assert.strictEqual(typeof grpcClient.createCollection, 'function');
  assert.strictEqual(typeof grpcClient.search, 'function');
  assert.strictEqual(typeof DataType.FloatVector, 'number');
  assert.strictEqual(typeof ErrorCode.SUCCESS, 'string');

  const httpClient = new HttpClient({
    endpoint: 'http://localhost:18080',
    token: 'test-token',
  });

  assert.strictEqual(typeof httpClient.listCollections, 'function');
  assert.strictEqual(typeof httpClient.search, 'function');
  assert.strictEqual(httpClient.baseURL, 'http://localhost:18080/v2');

  return 'PASS: client constructors and core exports are available offline';
};
