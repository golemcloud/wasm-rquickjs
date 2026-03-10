import assert from 'assert';
import protobuf from 'protobufjs';

export const run = () => {
  const root = protobuf.Root.fromJSON({
    nested: {
      sample: {
        nested: {
          Envelope: {
            oneofs: {
              payload: {
                oneof: ['text', 'count'],
              },
            },
            fields: {
              text: { type: 'string', id: 1 },
              count: { type: 'int32', id: 2 },
              labels: { keyType: 'string', type: 'string', id: 3 },
            },
          },
        },
      },
    },
  });

  const Envelope = root.lookupType('sample.Envelope');
  const created = Envelope.create({
    text: 'hello',
    labels: {
      env: 'test',
      runtime: 'quickjs',
    },
  });

  const encoded = Envelope.encode(created).finish();
  const decoded = Envelope.decode(encoded);

  const objectValue = Envelope.toObject(decoded, {
    defaults: true,
    oneofs: true,
  });

  assert.strictEqual(objectValue.text, 'hello');
  assert.strictEqual(objectValue.payload, 'text');
  assert.deepStrictEqual(objectValue.labels, { env: 'test', runtime: 'quickjs' });
  return 'PASS: oneof and map field behavior works';
};
