import assert from 'assert';
import { CohereClient, CohereClientV2, CohereEnvironment } from 'cohere-ai';

export const run = async () => {
  const calls = [];
  const fetchMock = async (url, init = {}) => {
    calls.push({
      url: String(url),
      method: init.method,
    });

    return new Response(JSON.stringify({ valid: true }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    });
  };

  const client = new CohereClient({
    token: 'test-token',
    fetch: fetchMock,
  });
  const clientV2 = new CohereClientV2({
    token: 'test-token',
    fetch: fetchMock,
  });

  assert.ok(client.v2);
  assert.ok(client.models);
  assert.ok(client.datasets);
  assert.ok(client.connectors);
  assert.ok(client.embedJobs);
  assert.ok(client.finetuning);
  assert.ok(client.batches);
  assert.ok(clientV2);

  const result = await client.checkApiKey();
  assert.strictEqual(result.valid, true);
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].method, 'POST');
  assert.ok(calls[0].url.startsWith(CohereEnvironment.Production));
  assert.ok(calls[0].url.endsWith('/v1/check-api-key'));

  return 'PASS: Cohere clients construct with default environment and expose core sub-clients';
};
