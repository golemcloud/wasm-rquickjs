import assert from 'assert';
import protobuf from 'protobufjs';

export const run = async () => {
  const root = protobuf.Root.fromJSON({
    nested: {
      rpcdemo: {
        nested: {
          PingRequest: {
            fields: {
              message: { type: 'string', id: 1 },
            },
          },
          PingResponse: {
            fields: {
              message: { type: 'string', id: 1 },
            },
          },
          EchoService: {
            methods: {
              Echo: {
                requestType: 'PingRequest',
                responseType: 'PingResponse',
              },
            },
          },
        },
      },
    },
  });

  const PingRequest = root.lookupType('rpcdemo.PingRequest');
  const PingResponse = root.lookupType('rpcdemo.PingResponse');
  const EchoService = root.lookupService('rpcdemo.EchoService');

  const rpcImpl = (method, requestData, callback) => {
    const req = PingRequest.decode(requestData);
    const responseData = PingResponse.encode({ message: `echo:${req.message}` }).finish();
    callback(null, responseData);
  };

  const client = EchoService.create(rpcImpl, false, false);
  const response = await new Promise((resolve, reject) => {
    client.echo({ message: 'hello' }, (err, message) => {
      if (err) {
        reject(err);
      } else {
        resolve(message);
      }
    });
  });

  assert.strictEqual(response.message, 'echo:hello');
  return 'PASS: rpc.Service client stubs and callbacks work';
};
