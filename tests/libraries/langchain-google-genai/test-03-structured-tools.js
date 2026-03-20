import assert from 'assert';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export const run = () => {
  const llm = new ChatGoogleGenerativeAI({
    apiKey: 'test-key',
    model: 'gemini-2.0-flash',
    maxRetries: 0,
  });

  const modelWithTools = llm.bindTools([
    {
      type: 'function',
      function: {
        name: 'lookupWeather',
        description: 'Lookup weather by city',
        parameters: {
          type: 'object',
          properties: {
            city: { type: 'string' },
          },
          required: ['city'],
        },
      },
    },
  ]);

  assert.strictEqual(typeof modelWithTools.invoke, 'function');

  const schema = {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      confidence: { type: 'number' },
    },
    required: ['summary', 'confidence'],
    additionalProperties: false,
  };

  const structured = llm.withStructuredOutput(schema, {
    name: 'SummarySchema',
    method: 'jsonSchema',
  });
  assert.strictEqual(typeof structured.invoke, 'function');

  assert.throws(
    () => llm.withStructuredOutput(schema, { method: 'jsonMode' }),
    /only supports.*jsonSchema.*functionCalling/i
  );

  return 'PASS: tool binding and structured output setup work offline';
};
