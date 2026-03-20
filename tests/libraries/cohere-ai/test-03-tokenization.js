import assert from 'assert';
import { CohereClient } from 'cohere-ai';

export const run = async () => {
  const requests = [];

  const client = new CohereClient({
    token: 'test-token',
    fetch: async (url, init = {}) => {
      const path = new URL(String(url)).pathname;
      const body = init.body ? JSON.parse(init.body) : {};
      requests.push({
        path,
        method: init.method,
        body,
      });

      if (path === '/v1/tokenize') {
        return new Response(JSON.stringify({
          tokens: [123, 456],
          token_strings: ['hello', 'world'],
        }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        });
      }

      if (path === '/v1/detokenize') {
        return new Response(JSON.stringify({
          text: 'hello world',
        }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        });
      }

      throw new Error(`Unexpected request path: ${path}`);
    },
  });

  const tokenized = await client.tokenize({
    text: 'hello world',
    model: 'command',
  });

  const detokenized = await client.detokenize({
    tokens: [123, 456],
    model: 'command',
  });

  assert.deepStrictEqual(tokenized.tokens, [123, 456]);
  assert.deepStrictEqual(tokenized.tokenStrings, ['hello', 'world']);
  assert.strictEqual(detokenized.text, 'hello world');

  assert.strictEqual(requests.length, 2);
  assert.deepStrictEqual(requests[0], {
    path: '/v1/tokenize',
    method: 'POST',
    body: {
      text: 'hello world',
      model: 'command',
    },
  });
  assert.deepStrictEqual(requests[1], {
    path: '/v1/detokenize',
    method: 'POST',
    body: {
      tokens: [123, 456],
      model: 'command',
    },
  });

  return 'PASS: tokenize() and detokenize() handle request serialization and response parsing';
};
