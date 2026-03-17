import assert from 'assert';
import OpenAI from 'openai';

export const run = async () => {
  const apiKey = process.env.OPENAI_API_KEY || 'missing-openai-api-key';

  const client = new OpenAI({ apiKey });

  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: 'Hello world',
  });

  assert.strictEqual(response.object, 'list');
  assert.ok(response.data.length > 0, 'Expected at least one embedding');
  assert.strictEqual(response.data[0].object, 'embedding');
  assert.ok(Array.isArray(response.data[0].embedding), 'Expected embedding to be an array');
  assert.ok(response.data[0].embedding.length > 0, 'Expected non-empty embedding vector');
  assert.ok(response.usage.total_tokens > 0, 'Expected positive token usage');

  return 'PASS: live embeddings.create returns valid embedding vector';
};
