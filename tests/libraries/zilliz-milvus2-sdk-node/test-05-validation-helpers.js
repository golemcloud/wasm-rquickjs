import assert from 'assert';
import {
  checkCollectionName,
  checkSearchParams,
  DataType,
  isVectorType,
  validatePartitionNumbers,
} from '@zilliz/milvus2-sdk-node';

export const run = () => {
  assert.throws(() => checkCollectionName({}), /collection_name/i);
  checkCollectionName({ collection_name: 'books' });

  assert.throws(
    () => checkSearchParams({ collection_name: 'books' }),
    /vector/i,
  );
  checkSearchParams({ collection_name: 'books', vector: [0.1, 0.2, 0.3] });

  validatePartitionNumbers(1);
  validatePartitionNumbers(8);
  assert.throws(() => validatePartitionNumbers(0), /partition/i);

  assert.strictEqual(isVectorType(DataType.FloatVector), true);
  assert.strictEqual(isVectorType(DataType.Int64), false);

  return 'PASS: validation helpers reject bad input and accept valid input';
};
