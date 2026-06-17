const assert = require('node:assert');
const { pack, unpack } = require('msgpackr');
const protobuf = require('protobufjs');

exports.run = () => {
  const input = { name: 'installed-app', count: 3, nested: { ok: true } };
  assert.deepStrictEqual(unpack(pack(input)), input);

  const Awesome = new protobuf.Type('Awesome')
    .add(new protobuf.Field('name', 1, 'string'))
    .add(new protobuf.Field('count', 2, 'int32'));
  const message = Awesome.create({ name: 'protobuf', count: 7 });
  const decoded = Awesome.decode(Awesome.encode(message).finish());
  assert.deepStrictEqual(Awesome.toObject(decoded), { name: 'protobuf', count: 7 });
  return 'PASS: msgpackr and protobufjs execute from installed packages';
};
