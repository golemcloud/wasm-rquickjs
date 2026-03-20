import assert from 'assert';
import {
  formatAddress,
  getAuthString,
  parseTimeToken,
  stringToBase64,
} from '@zilliz/milvus2-sdk-node';

export const run = () => {
  assert.strictEqual(getAuthString({ username: 'root', password: 'Milvus' }), stringToBase64('root:Milvus'));
  assert.strictEqual(getAuthString({ token: 'secret-token' }), stringToBase64('secret-token'));
  assert.strictEqual(getAuthString({}), '');

  assert.strictEqual(formatAddress('https://milvus.local:19530'), 'milvus.local:19530');
  assert.strictEqual(formatAddress('http://127.0.0.1:19530'), '127.0.0.1:19530');

  assert.strictEqual(parseTimeToken('30s'), 30000);
  assert.strictEqual(parseTimeToken('2m'), 120000);
  assert.throws(() => parseTimeToken('10x'), /Invalid time token/);

  return 'PASS: auth and formatting helpers behave as expected';
};
