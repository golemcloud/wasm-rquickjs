import assert from 'assert';
import { Client, Errors } from 'typesense';

export const run = async () => {
  const client = new Client({
    nodes: [{ host: 'localhost', port: 8108, protocol: 'http' }],
    apiKey: 'test-api-key',
    randomizeNodes: false,
  });

  const documents = client.collections('books').documents();
  documents.apiCall.performRequest = async () =>
    [
      JSON.stringify({ success: true, id: '1' }),
      JSON.stringify({ success: false, id: '2', error: 'Field `title` must be a string.' }),
    ].join('\n');

  await assert.rejects(
    () => documents.import([{ id: '1', title: 'ok' }, { id: '2', title: 10 }], { action: 'create' }),
    (error) => {
      assert.ok(error instanceof Errors.ImportError);
      assert.strictEqual(error.importResults.length, 2);
      assert.strictEqual(error.importResults[1].success, false);
      assert.ok(error.importResults[1].error.includes('must be a string'));
      return true;
    },
  );

  const partial = await documents.import(
    [{ id: '1', title: 'ok' }, { id: '2', title: 10 }],
    { action: 'create', throwOnFail: false },
  );
  assert.strictEqual(partial.length, 2);
  assert.strictEqual(partial[0].success, true);
  assert.strictEqual(partial[1].success, false);

  return 'PASS: import failures surface as ImportError and can be returned as partial results';
};
