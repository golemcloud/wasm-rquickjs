import assert from 'assert';
import Instructor from '@instructor-ai/instructor';
import { z } from 'zod';

export const run = async () => {
  let calls = 0;

  const instructor = Instructor({
    client: {
      baseURL: 'https://api.openai.com/v1',
      chat: {
        completions: {
          create: async () => {
            calls += 1;
            return {
              id: 'chatcmpl-fail',
              object: 'chat.completion',
              created: 4,
              model: 'gpt-4o-mini',
              choices: [
                {
                  index: 0,
                  message: {
                    role: 'assistant',
                    content: null,
                    tool_calls: [
                      {
                        id: 'call_fail',
                        type: 'function',
                        function: {
                          name: 'ExtractScore',
                          arguments: JSON.stringify({ score: 'not-a-number' }),
                        },
                      },
                    ],
                  },
                  finish_reason: 'tool_calls',
                },
              ],
            };
          },
        },
      },
    },
    mode: 'TOOLS',
  });

  const schema = z.object({ score: z.number() });

  await assert.rejects(
    async () => {
      await instructor.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'extract score' }],
        response_model: {
          name: 'ExtractScore',
          schema,
        },
        max_retries: 0,
      });
    },
    (error) => {
      const message = String(error?.message || error);
      return message.includes('score');
    }
  );

  assert.strictEqual(calls, 1);

  return 'PASS: max_retries=0 surfaces schema validation error without additional attempts';
};
