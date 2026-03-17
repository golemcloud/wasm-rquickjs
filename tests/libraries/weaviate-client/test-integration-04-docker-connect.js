import assert from 'assert';
import weaviate from 'weaviate-client';

export const run = async () => {
  const client = await weaviate.connectToLocal({
    host: 'localhost',
    port: 18090,
    grpcPort: 15051,
    skipInitChecks: true,
  });

  const meta = await client.getMeta();
  const ready = await client.isReady();

  assert.ok(typeof meta.version === 'string' && meta.version.length > 0);
  assert.strictEqual(ready, true);

  await client.close();
  return 'PASS: connectToLocal can reach Docker Weaviate health/meta endpoints';
};
