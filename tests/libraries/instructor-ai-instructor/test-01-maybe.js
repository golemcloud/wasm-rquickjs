import assert from 'assert';
import Instructor from '@instructor-ai/instructor';

export const run = () => {
  const baseClient = {
    baseURL: 'https://api.groq.com/openai/v1',
    customMarker: 'proxy-ok',
    chat: {
      completions: {
        create: async () => ({
          id: 'chatcmpl-mock',
          object: 'chat.completion',
          created: 1,
          model: 'llama-3.3-70b',
          choices: [{ index: 0, message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }],
        }),
      },
    },
  };

  const client = Instructor({
    client: baseClient,
    mode: 'TOOLS',
  });

  assert.strictEqual(client.provider, 'GROQ');
  assert.strictEqual(client.customMarker, 'proxy-ok');
  assert.strictEqual(typeof client.chat.completions.create, 'function');

  return 'PASS: createInstructor proxy preserves client properties and provider detection';
};
