import assert from 'assert';
import protoLoader from '@grpc/proto-loader';

export const run = () => {
  const fileDescriptorSet = {
    file: [
      {
        name: 'echo.proto',
        package: 'demo',
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
            name: 'EchoService',
            method: [
              {
                name: 'Echo',
                inputType: '.demo.EchoRequest',
                outputType: '.demo.EchoReply',
              },
            ],
          },
        ],
        syntax: 'proto3',
      },
    ],
  };

  const packageDefinition = protoLoader.loadFileDescriptorSetFromObject(fileDescriptorSet, {});

  assert.ok(packageDefinition['demo.EchoService']);
  assert.strictEqual(packageDefinition['demo.EchoService'].Echo.path, '/demo.EchoService/Echo');

  const requestDefinition = packageDefinition['demo.EchoRequest'];
  const encoded = requestDefinition.serialize({ message: 'hello' });
  const decoded = requestDefinition.deserialize(encoded);
  assert.strictEqual(decoded.message, 'hello');
  assert.ok(Array.isArray(requestDefinition.fileDescriptorProtos));

  return 'PASS: loadFileDescriptorSetFromObject builds service and message codecs';
};
