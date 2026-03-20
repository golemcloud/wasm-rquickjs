import assert from 'assert';
import { Client, Errors } from 'typesense';

const client = new Client({
  nodes: [{ host: 'localhost', port: 18080, protocol: 'http' }],
  apiKey: 'test-api-key',
  randomizeNodes: false,
  connectionTimeoutSeconds: 2,
});

const collectionName = 'mock_books_errors';

export const run = async () => {
  await client.collections().create({
    name: collectionName,
    fields: [{ name: 'title', type: 'string' }],
  });

  try {
    await assert.rejects(
      () => client.collections().create({ name: collectionName, fields: [{ name: 'title', type: 'string' }] }),
      (error) => {
        assert.ok(error instanceof Errors.ObjectAlreadyExists);
        assert.strictEqual(error.httpStatus, 409);
        return true;
      },
    );

    await assert.rejects(
      () => client.collections('missing_collection').retrieve(),
      (error) => {
        assert.ok(error instanceof Errors.ObjectNotFound);
        assert.strictEqual(error.httpStatus, 404);
        return true;
      },
    );
  } finally {
    await client.collections(collectionName).delete();
  }

  return 'PASS: Typesense error mapping (404/409) works against HTTP mock server';
};
