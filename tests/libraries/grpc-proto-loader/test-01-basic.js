import assert from 'assert';
import protoLoader from '@grpc/proto-loader';

export const run = () => {
  const descriptor = {
    nested: {
      GreeterRequest: {
        fields: {
          name: { type: 'string', id: 1 },
        },
      },
      GreeterResponse: {
        fields: {
          message: { type: 'string', id: 1 },
        },
      },
      Greeter: {
        methods: {
          SayHello: {
            requestType: 'GreeterRequest',
            responseType: 'GreeterResponse',
          },
        },
      },
    },
  };

  const packageDefinition = protoLoader.fromJSON(descriptor, { keepCase: true });
  const service = packageDefinition.Greeter;

  assert.ok(service, 'service definition should exist');
  assert.ok(service.SayHello, 'method should exist on service definition');
  assert.strictEqual(service.SayHello.path, '/Greeter/SayHello');
  assert.strictEqual(service.SayHello.requestStream, false);
  assert.strictEqual(service.SayHello.responseStream, false);
  assert.strictEqual(typeof service.SayHello.requestSerialize, 'function');
  assert.strictEqual(typeof service.SayHello.responseDeserialize, 'function');

  return 'PASS: fromJSON creates service and method definitions';
};
