import assert from 'assert';
import OpenAI from 'openai';

const BASE = 'http://localhost:18080/v1';

export const run = async () => {
  const client = new OpenAI({
    apiKey: 'test-openai-key',
    baseURL: BASE,
  });

  const { data, request_id } = await client.models.list().withResponse();
  assert.strictEqual(data.object, 'list');
  assert.strictEqual(data.data[0].id, 'gpt-mock-1');
  assert.ok(request_id, 'Expected x-request-id to be present');

  return 'PASS: models.list() succeeds against HTTP mock server';
};
