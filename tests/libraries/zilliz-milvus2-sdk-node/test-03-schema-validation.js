import assert from 'assert';
import {
  assignTypeParams,
  buildDefaultSchema,
  checkCollectionFields,
  convertToDataType,
  DataType,
} from '@zilliz/milvus2-sdk-node';

export const run = () => {
  const schema = buildDefaultSchema({
    primary_field_name: 'id',
    id_type: DataType.Int64,
    auto_id: false,
    vector_field_name: 'embedding',
    dimension: 4,
  });

  assert.strictEqual(schema.length, 2);
  assert.strictEqual(schema[0].name, 'id');
  assert.strictEqual(schema[1].data_type, DataType.FloatVector);
  assert.strictEqual(checkCollectionFields(schema), true);

  const fieldWithTypeParams = assignTypeParams({
    name: 'embedding',
    data_type: DataType.FloatVector,
    dim: 8,
    'mmap.enabled': true,
  });

  assert.deepStrictEqual(fieldWithTypeParams.type_params, {
    dim: '8',
    'mmap.enabled': 'true',
  });
  assert.ok(!('dim' in fieldWithTypeParams));

  assert.strictEqual(convertToDataType('FloatVector'), DataType.FloatVector);
  assert.strictEqual(convertToDataType(106), 106);

  return 'PASS: schema builders and validators work offline';
};
