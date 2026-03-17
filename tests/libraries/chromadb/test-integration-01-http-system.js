import assert from 'assert';
import { ChromaClient } from 'chromadb';

const BASE_URL = 'http://localhost:18080';

export const run = async () => {
  const client = new ChromaClient({ path: BASE_URL });

  const version = await client.version();
  assert.strictEqual(version, 'mock-1.0.0');

  const heartbeat = await client.heartbeat();
  assert.strictEqual(heartbeat, 123456789);

  const preflight = await client.getPreflightChecks();
  assert.strictEqual(preflight.max_batch_size, 1024);
  assert.strictEqual(preflight.supports_base64_encoding, true);

  return 'PASS: Chroma system endpoints (version/heartbeat/preflight) work over HTTP';
};
