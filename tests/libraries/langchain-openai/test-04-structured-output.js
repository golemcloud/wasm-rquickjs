import assert from 'assert';
import { ChatOpenAI } from '@langchain/openai';

export const run = () => {
  const llm = new ChatOpenAI({
    apiKey: 'test-key',
    model: 'gpt-4o-mini',
    maxRetries: 0,
  });

  const schema = {
    title: 'AnswerSchema',
    type: 'object',
    properties: {
      answer: { type: 'string' },
      confidence: { type: 'number' },
    },
    required: ['answer', 'confidence'],
    additionalProperties: false,
  };

  const structured = llm.withStructuredOutput(schema, {
    name: 'AnswerSchema',
    method: 'jsonSchema',
  });

  assert.ok(structured, 'Expected structured runnable');
  assert.strictEqual(typeof structured.invoke, 'function');

  return 'PASS: withStructuredOutput builds a structured-output runnable offline';
};
