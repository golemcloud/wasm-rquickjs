import assert from 'assert';
import protoLoader from '@grpc/proto-loader';

const descriptor = {
  nested: {
    Choice: {
      oneofs: {
        kind: { oneof: ['name', 'code'] },
      },
      fields: {
        name: { type: 'string', id: 1 },
        code: { type: 'int32', id: 2 },
        tags: { rule: 'repeated', type: 'string', id: 3 },
      },
    },
  },
};

export const run = () => {
  const withoutOneof = protoLoader.fromJSON(descriptor, {
    arrays: true,
    defaults: true,
  });
  const decodedWithout = withoutOneof.Choice.deserialize(withoutOneof.Choice.serialize({ name: 'alice' }));
  assert.ok(!Object.prototype.hasOwnProperty.call(decodedWithout, 'kind'));
  assert.deepStrictEqual(decodedWithout.tags, []);

  const withOneof = protoLoader.fromJSON(descriptor, {
    arrays: true,
    defaults: true,
    oneofs: true,
  });
  const decodedWith = withOneof.Choice.deserialize(withOneof.Choice.serialize({ name: 'alice' }));
  assert.strictEqual(decodedWith.kind, 'name');
  assert.deepStrictEqual(decodedWith.tags, []);

  return 'PASS: oneofs/defaults/arrays options affect decoded message shape';
};
