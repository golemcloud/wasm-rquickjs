import assert from 'assert';
import protobuf from 'protobufjs';

export const run = () => {
  const protoSource = `
    syntax = "proto3";
    package parsed;

    message Task {
      string name = 1;
      bool done = 2;
    }
  `;

  const parsed = protobuf.parse(protoSource);
  const Task = parsed.root.lookupType('parsed.Task');

  const payload = { name: 'ship', done: true };
  const err = Task.verify(payload);
  assert.strictEqual(err, null);

  const encoded = Task.encode(Task.create(payload)).finish();
  const decoded = Task.decode(encoded);

  assert.deepStrictEqual(Task.toObject(decoded), payload);
  return 'PASS: .proto text parsing and roundtrip work';
};
