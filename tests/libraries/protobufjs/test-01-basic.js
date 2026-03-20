import assert from 'assert';
import protobuf from 'protobufjs';

export const run = () => {
  const root = protobuf.Root.fromJSON({
    nested: {
      tutorial: {
        nested: {
          Person: {
            fields: {
              name: { type: 'string', id: 1 },
              id: { type: 'int32', id: 2 },
              email: { type: 'string', id: 3 },
            },
          },
        },
      },
    },
  });

  const Person = root.lookupType('tutorial.Person');
  const payload = { name: 'Ada', id: 101, email: 'ada@example.com' };

  const err = Person.verify(payload);
  assert.strictEqual(err, null);

  const message = Person.create(payload);
  const encoded = Person.encode(message).finish();
  const decoded = Person.decode(encoded);

  assert.deepStrictEqual(Person.toObject(decoded), payload);
  return 'PASS: basic Root.fromJSON encode/decode works';
};
