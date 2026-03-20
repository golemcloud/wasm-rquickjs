import assert from 'assert';
import protoLoader from '@grpc/proto-loader';
import descriptor from 'protobufjs/ext/descriptor/index.js';

export const run = () => {
  const fileDescriptorSet = {
    file: [
      {
        name: 'buffer.proto',
        package: 'bufferdemo',
        messageType: [
          {
            name: 'EchoRequest',
            field: [
              {
                name: 'message',
                number: 1,
                label: 'LABEL_OPTIONAL',
                type: 'TYPE_STRING',
                jsonName: 'message',
              },
            ],
          },
          {
            name: 'EchoReply',
            field: [
              {
                name: 'message',
                number: 1,
                label: 'LABEL_OPTIONAL',
                type: 'TYPE_STRING',
                jsonName: 'message',
              },
            ],
          },
        ],
        service: [
          {
            name: 'BufferEchoService',
            method: [
              {
                name: 'Echo',
                inputType: '.bufferdemo.EchoRequest',
                outputType: '.bufferdemo.EchoReply',
              },
            ],
          },
        ],
        syntax: 'proto3',
      },
    ],
  };

  const descriptorMessage = descriptor.FileDescriptorSet.fromObject(fileDescriptorSet);
  const descriptorBuffer = Buffer.from(descriptor.FileDescriptorSet.encode(descriptorMessage).finish());

  const packageDefinition = protoLoader.loadFileDescriptorSetFromBuffer(descriptorBuffer, {});
  assert.ok(packageDefinition['bufferdemo.BufferEchoService']);
  assert.strictEqual(
    packageDefinition['bufferdemo.BufferEchoService'].Echo.path,
    '/bufferdemo.BufferEchoService/Echo',
  );

  assert.strictEqual(protoLoader.isAnyExtension({ '@type': 'type.googleapis.com/bufferdemo.EchoRequest' }), true);
  assert.strictEqual(protoLoader.isAnyExtension({ message: 'hello' }), false);
  assert.strictEqual(typeof protoLoader.Long.fromString('42').toString, 'function');

  let loadSyncError;
  try {
    protoLoader.loadSync('missing-file.proto', {
      includeDirs: ['.'],
      keepCase: true,
    });
  } catch (error) {
    loadSyncError = error;
  }

  assert.ok(loadSyncError instanceof Error, 'bundled loadSync should throw in this runtime path');
  assert.match(String(loadSyncError.message), /readFileSync|ENOENT|not found/);

  return 'PASS: descriptor-buffer APIs work, but bundled loadSync is unavailable in this environment';
};
