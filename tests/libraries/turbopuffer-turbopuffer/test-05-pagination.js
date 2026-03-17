import assert from 'assert';
import Turbopuffer from '@turbopuffer/turbopuffer';

export const run = async () => {
  const fetchMock = async (url) => {
    const parsed = new URL(url);
    const cursor = parsed.searchParams.get('cursor');

    if (!cursor) {
      return new Response(
        JSON.stringify({
          namespaces: [{ id: 'vec-a' }],
          next_cursor: 'page-2',
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    }

    return new Response(
      JSON.stringify({
        namespaces: [{ id: 'vec-b' }],
        next_cursor: '',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  };

  const client = new Turbopuffer({
    apiKey: 'tpuf_test_key',
    baseURL: 'http://localhost:18080',
    region: null,
    fetch: fetchMock,
  });

  const firstPage = await client.namespaces({ prefix: 'vec' });
  assert.strictEqual(firstPage.hasNextPage(), true);

  const secondPage = await firstPage.getNextPage();
  assert.strictEqual(secondPage.hasNextPage(), false);

  const ids = [];
  for await (const namespace of client.namespaces({ prefix: 'vec' })) {
    ids.push(namespace.id);
  }

  assert.deepStrictEqual(ids, ['vec-a', 'vec-b']);

  return 'PASS: Auto-pagination traverses NamespacePage responses across cursors';
};
