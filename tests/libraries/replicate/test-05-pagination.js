import assert from 'assert';
import Replicate from 'replicate';

export const run = async () => {
  const calls = [];

  const fetchMock = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
      headers: new Headers(init.headers),
    });

    if (String(url).includes('cursor=next-page')) {
      return new Response(
        JSON.stringify({
          next: null,
          previous: 'https://api.replicate.com/v1/models?cursor=first-page',
          results: [{ owner: 'meta', name: 'llama-2' }],
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );
    }

    return new Response(
      JSON.stringify({
        next: 'https://api.replicate.com/v1/models?cursor=next-page',
        previous: null,
        results: [{ owner: 'stability-ai', name: 'sdxl' }],
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  };

  const client = new Replicate({
    auth: 'r8_test_token',
    fetch: fetchMock,
    baseUrl: 'https://api.replicate.com/v1',
  });

  const seen = [];
  for await (const page of client.paginate(() =>
    client.request('/models?page_size=1', {
      method: 'GET',
    }).then((response) => response.json()),
  )) {
    for (const model of page) {
      seen.push(model.name);
    }
  }

  assert.deepStrictEqual(seen, ['sdxl', 'llama-2']);
  assert.strictEqual(calls.length, 2);
  assert.ok(calls[0].url.includes('/models?page_size=1'));
  assert.ok(calls[1].url.includes('cursor=next-page'));
  assert.strictEqual(calls[0].headers.get('authorization'), 'Bearer r8_test_token');

  return 'PASS: paginate walks multi-page model lists';
};
