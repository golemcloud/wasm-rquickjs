import assert from 'assert';
import Instructor from '@instructor-ai/instructor';
import { z } from 'zod';

const makeToolCompletion = (age) => ({
  id: `chatcmpl-${age}`,
  object: 'chat.completion',
  created: 3,
  model: 'gpt-4o-mini',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: 'call_retry',
            type: 'function',
            function: {
              name: 'ExtractPerson',
              arguments: JSON.stringify({ name: 'Ada', age }),
            },
          },
        ],
      },
      finish_reason: 'tool_calls',
    },
  ],
  usage: {
    prompt_tokens: 12,
    completion_tokens: 6,
    total_tokens: 18,
  },
});

export const run = async () => {
  let attempts = 0;

  const instructor = Instructor({
    client: {
      baseURL: 'https://api.openai.com/v1',
      chat: {
        completions: {
          create: async () => {
            attempts += 1;
            if (attempts === 1) {
              return makeToolCompletion('invalid-age');
            }
            return makeToolCompletion(37);
          },
        },
      },
    },
    mode: 'TOOLS',
  });

  const schema = z.object({
    name: z.string(),
    age: z.number(),
  });

  const result = await instructor.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'extract person' }],
    response_model: {
      name: 'ExtractPerson',
      schema,
    },
    max_retries: 1,
  });

  assert.strictEqual(attempts, 2);
  assert.strictEqual(result.name, 'Ada');
  assert.strictEqual(result.age, 37);
  assert.strictEqual(result._meta.usage.total_tokens, 18);

  return 'PASS: response_model retries once on Zod validation errors and returns parsed data';
};
