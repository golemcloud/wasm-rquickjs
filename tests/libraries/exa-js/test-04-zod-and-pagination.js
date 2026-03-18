import assert from 'assert';
import Exa from 'exa-js';
import { z } from 'zod';

export const run = async () => {
  const exa = new Exa('test-api-key', 'http://localhost:18080');
  const calls = [];

  exa.request = async (endpoint, method, body, params) => {
    calls.push({ endpoint, method, body, params });
    return { endpoint, method, body, params };
  };

  const schema = z.object({
    topic: z.string(),
    confidence: z.number(),
  });

  await exa.answer('Summarize this', { outputSchema: schema, text: true });
  const answerCall = calls.at(-1);
  assert.strictEqual(answerCall.endpoint, '/answer');
  assert.strictEqual(answerCall.body.stream, false);
  assert.strictEqual(answerCall.body.text, true);
  assert.strictEqual(answerCall.body.model, 'exa');
  assert.strictEqual(answerCall.body.outputSchema.type, 'object');
  assert.strictEqual(answerCall.body.outputSchema.properties.topic.type, 'string');
  assert.strictEqual(answerCall.body.outputSchema.properties.confidence.type, 'number');

  await exa.research.create({ instructions: 'Find key points', outputSchema: schema });
  const researchCreateCall = calls.at(-1);
  assert.strictEqual(researchCreateCall.endpoint, '/research/v1');
  assert.strictEqual(researchCreateCall.method, 'POST');
  assert.strictEqual(researchCreateCall.body.model, 'exa-research-fast');
  assert.strictEqual(researchCreateCall.body.outputSchema.type, 'object');

  await exa.websets.list({ cursor: 'abc', limit: 7 });
  const websetsListCall = calls.at(-1);
  assert.strictEqual(websetsListCall.endpoint, '/websets/v0/websets');
  assert.strictEqual(websetsListCall.method, 'GET');
  assert.strictEqual(websetsListCall.params.cursor, 'abc');
  assert.strictEqual(websetsListCall.params.limit, 7);

  return 'PASS: zod schemas and pagination params are converted correctly';
};
