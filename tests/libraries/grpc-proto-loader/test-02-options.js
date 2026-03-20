import assert from 'assert';
import protoLoader from '@grpc/proto-loader';

const descriptor = {
  nested: {
    Status: {
      values: {
        UNKNOWN: 0,
        OK: 1,
      },
    },
    Payload: {
      fields: {
        id: { type: 'int64', id: 1 },
        status: { type: 'Status', id: 2 },
        raw: { type: 'bytes', id: 3 },
      },
    },
  },
};

export const run = () => {
  const defaultPkg = protoLoader.fromJSON(descriptor, {});
  const defaultPayload = defaultPkg.Payload;
  const encodedDefault = defaultPayload.serialize({
    id: protoLoader.Long.fromString('1234567890123'),
    status: 1,
    raw: Buffer.from('ab'),
  });
  const decodedDefault = defaultPayload.deserialize(encodedDefault);

  assert.ok(
    typeof decodedDefault.id === 'object' || typeof decodedDefault.id === 'number',
    'default long value should decode to Long-like object or number',
  );
  assert.strictEqual(decodedDefault.status, 1, 'default enum should decode to number');
  assert.ok(
    Buffer.isBuffer(decodedDefault.raw) || decodedDefault.raw instanceof Uint8Array,
    'default bytes should decode to Buffer or Uint8Array',
  );

  const stringPkg = protoLoader.fromJSON(descriptor, {
    longs: String,
    enums: String,
    bytes: String,
  });
  const stringPayload = stringPkg.Payload;
  const encodedString = stringPayload.serialize({
    id: '1234567890123',
    status: 1,
    raw: Buffer.from('ab'),
  });
  const decodedString = stringPayload.deserialize(encodedString);

  assert.strictEqual(decodedString.id, '1234567890123');
  assert.strictEqual(decodedString.status, 'OK');
  assert.strictEqual(decodedString.raw, Buffer.from('ab').toString('base64'));

  return 'PASS: conversion options longs/enums/bytes affect decoded output';
};
