import assert from 'assert';
import { textToImage } from '@huggingface/inference';

export const run = async () => {
  const calls = [];

  const pngHeader = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const mockFetch = async (url, init) => {
    calls.push({
      url: String(url),
      method: init.method,
      headers: new Headers(init.headers),
      body: JSON.parse(init.body),
    });

    return new Response(new Blob([pngHeader], { type: 'image/png' }), {
      status: 200,
      headers: { 'content-type': 'image/png' },
    });
  };

  const output = await textToImage(
    {
      accessToken: 'hf_mock_token',
      endpointUrl: 'https://example.com/custom-image-endpoint',
      inputs: 'A small orange robot reading docs',
    },
    { fetch: mockFetch },
  );

  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].method, 'POST');
  assert.strictEqual(calls[0].url, 'https://example.com/custom-image-endpoint');
  assert.strictEqual(calls[0].headers.get('authorization'), 'Bearer hf_mock_token');
  assert.strictEqual(calls[0].headers.get('content-type'), 'application/json');
  assert.strictEqual(calls[0].body.inputs, 'A small orange robot reading docs');

  assert.ok(output instanceof Blob);
  assert.strictEqual(output.type, 'image/png');
  assert.strictEqual(output.size, pngHeader.length);

  return 'PASS: textToImage supports custom endpoint URL and returns binary image output';
};
