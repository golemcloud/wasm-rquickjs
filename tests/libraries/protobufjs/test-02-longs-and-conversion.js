import assert from 'assert';
import Long from 'long';
import protobuf from 'protobufjs';

export const run = () => {
  protobuf.util.Long = Long;
  protobuf.configure();

  const root = protobuf.Root.fromJSON({
    nested: {
      demo: {
        nested: {
          Counter: {
            fields: {
              value: { type: 'int64', id: 1 },
              tags: { rule: 'repeated', type: 'string', id: 2 },
            },
          },
        },
      },
    },
  });

  const Counter = root.lookupType('demo.Counter');
  const input = { value: '9007199254740995', tags: ['a', 'b'] };

  const fromObject = Counter.fromObject(input);
  const encoded = Counter.encode(fromObject).finish();
  const decoded = Counter.decode(encoded);

  const asObject = Counter.toObject(decoded, {
    longs: String,
    defaults: true,
    arrays: true,
  });

  assert.strictEqual(asObject.value, input.value);
  assert.deepStrictEqual(asObject.tags, input.tags);
  return 'PASS: int64 conversion and repeated fields work';
};
