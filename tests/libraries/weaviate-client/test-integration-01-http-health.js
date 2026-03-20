import assert from 'assert';
import weaviate from 'weaviate-client';

export const run = async () => {
  const client = await weaviate.connectToCustom({
    httpHost: 'localhost',
    httpPort: 18080,
    httpSecure: false,
    grpcHost: 'localhost',
    grpcPort: 15051,
    grpcSecure: false,
    skipInitChecks: true,
  });

  const meta = await client.getMeta();
  const live = await client.isLive();
  const ready = await client.isReady();

  assert.strictEqual(meta.version, '1.32.0');
  assert.strictEqual(live, true);
  assert.strictEqual(ready, true);

  await client.close();
  return 'PASS: mock HTTP server handles meta/live/ready endpoints';
};
