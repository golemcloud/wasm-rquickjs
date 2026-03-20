import assert from 'assert';
import { Metadata, credentials } from '@grpc/grpc-js';

export const run = async () => {
  const generated = credentials.createFromMetadataGenerator((options, callback) => {
    const metadata = new Metadata();
    metadata.set('authorization', `Bearer ${options.service_url}`);
    callback(null, metadata);
  });

  const composed = generated.compose(credentials.createEmpty());
  const output = await composed.generateMetadata({
    method_name: '/test.Service/Method',
    service_url: 'https://example.test',
  });

  assert.strictEqual(output.get('authorization')[0], 'Bearer https://example.test');

  const failing = credentials.createFromMetadataGenerator((_options, callback) => {
    callback(new Error('intentional metadata failure'));
  });

  await assert.rejects(
    failing.generateMetadata({ method_name: '/x', service_url: 'https://x' }),
    /intentional metadata failure/i,
  );

  return 'PASS: CallCredentials metadata generation and composition work';
};
