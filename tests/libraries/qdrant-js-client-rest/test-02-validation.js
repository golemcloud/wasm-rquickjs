import assert from 'node:assert';
import { QdrantClient, QdrantClientConfigError } from '@qdrant/js-client-rest';

export const run = () => {
  assert.throws(
    () => new QdrantClient({ url: 'http://localhost:6333', host: 'localhost', checkCompatibility: false }),
    (error) => {
      assert.ok(error instanceof QdrantClientConfigError);
      assert.match(error.message, /Only one of `url`, `host` params can be set/);
      return true;
    },
  );

  assert.throws(
    () => new QdrantClient({ host: 'http://localhost', checkCompatibility: false }),
    (error) => {
      assert.ok(error instanceof QdrantClientConfigError);
      assert.match(error.message, /not expected to contain neither protocol/);
      return true;
    },
  );

  assert.throws(
    () => new QdrantClient({ url: 'localhost:6333', checkCompatibility: false }),
    (error) => {
      assert.ok(error instanceof QdrantClientConfigError);
      assert.match(error.message, /valid URL starting with a protocol/);
      return true;
    },
  );

  return 'PASS: constructor validation rejects invalid host/url combinations';
};
