import assert from 'assert';
import { CohereClient, CohereClientV2 } from 'cohere-ai';

export const run = async () => {
  const oldApiKey = process.env.CO_API_KEY;
  process.env.CO_API_KEY = 'env-fallback-token';

  try {
    let envAuthHeader;

    const clientWithEnvToken = new CohereClient({
      fetch: async (_url, init = {}) => {
        const headers = new Headers(init.headers);
        envAuthHeader = headers.get('authorization');

        return new Response(JSON.stringify({ valid: true }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        });
      },
    });

    const check = await clientWithEnvToken.checkApiKey();
    assert.strictEqual(check.valid, true);
    assert.strictEqual(envAuthHeader, 'Bearer env-fallback-token');

    const v2Calls = [];
    const v2Client = new CohereClientV2({
      token: 'explicit-v2-token',
      fetch: async (url, init = {}) => {
        const headers = new Headers(init.headers);
        v2Calls.push({
          url: String(url),
          method: init.method,
          authorization: headers.get('authorization'),
          body: init.body ? JSON.parse(init.body) : {},
        });

        return new Response(JSON.stringify({
          id: 'resp_123',
          finish_reason: 'COMPLETE',
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: 'Mocked V2 answer' }],
          },
        }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        });
      },
    });

    const response = await v2Client.chat({
      model: 'command-r',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    assert.strictEqual(response.id, 'resp_123');
    assert.strictEqual(response.finishReason, 'COMPLETE');
    assert.strictEqual(response.message.role, 'assistant');
    assert.strictEqual(response.message.content[0].text, 'Mocked V2 answer');

    assert.strictEqual(v2Calls.length, 1);
    assert.strictEqual(v2Calls[0].method, 'POST');
    assert.ok(v2Calls[0].url.endsWith('/v2/chat'));
    assert.strictEqual(v2Calls[0].authorization, 'Bearer explicit-v2-token');
    assert.deepStrictEqual(v2Calls[0].body, {
      model: 'command-r',
      messages: [{ role: 'user', content: 'Hello' }],
      stream: false,
    });

    return 'PASS: v2 chat parses responses and supports process.env CO_API_KEY fallback';
  } finally {
    if (oldApiKey === undefined) {
      delete process.env.CO_API_KEY;
    } else {
      process.env.CO_API_KEY = oldApiKey;
    }
  }
};
