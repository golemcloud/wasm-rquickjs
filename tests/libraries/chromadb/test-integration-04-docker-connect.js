import assert from 'assert';
import { ChromaClient } from 'chromadb';

const BASE_URL = 'http://localhost:18081';

export const run = async () => {
  const client = new ChromaClient({ path: BASE_URL });

  const version = await client.version();
  assert.strictEqual(typeof version, 'string');
  assert.ok(version.length > 0);

  const heartbeat = await client.heartbeat();
  assert.strictEqual(typeof heartbeat, 'number');
  assert.ok(Number.isFinite(heartbeat));

  const identity = await client.getUserIdentity();
  assert.strictEqual(identity.tenant, 'default_tenant');
  assert.ok(Array.isArray(identity.databases));
  assert.ok(identity.databases.includes('default_database'));

  return 'PASS: connected to Docker Chroma and validated version/heartbeat/identity';
};
