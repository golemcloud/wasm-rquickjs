import assert from 'assert';
import Instructor from '@instructor-ai/instructor';

export const run = async () => {
  let seenParams;
  let seenOptions;

  const rawCompletion = {
    id: 'chatcmpl-pass',
    object: 'chat.completion',
    created: 2,
    model: 'gpt-4o-mini',
    choices: [{ index: 0, message: { role: 'assistant', content: 'RAW_OK' }, finish_reason: 'stop' }],
  };

  const instructor = Instructor({
    client: {
      baseURL: 'https://api.openai.com/v1',
      chat: {
        completions: {
          create: async (params, options) => {
            seenParams = params;
            seenOptions = options;
            return rawCompletion;
          },
        },
      },
    },
    mode: 'TOOLS',
  });

  const result = await instructor.chat.completions.create(
    {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'just return raw completion' }],
    },
    { timeout: 321 }
  );

  assert.strictEqual(result, rawCompletion);
  assert.strictEqual(seenParams.model, 'gpt-4o-mini');
  assert.strictEqual(seenOptions.timeout, 321);

  return 'PASS: calls without response_model pass through to underlying client unchanged';
};
