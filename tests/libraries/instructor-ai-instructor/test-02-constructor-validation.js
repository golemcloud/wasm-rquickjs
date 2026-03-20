import assert from 'assert';
import Instructor from '@instructor-ai/instructor';

const createMockClient = () => ({
  baseURL: 'https://api.openai.com/v1',
  chat: {
    completions: {
      create: async () => ({
        id: 'chatcmpl-mock',
        object: 'chat.completion',
        created: 1,
        model: 'gpt-4o-mini',
        choices: [{ index: 0, message: { role: 'assistant', content: '{}' }, finish_reason: 'stop' }],
      }),
    },
  },
});

export const run = () => {
  assert.throws(
    () => Instructor({ client: {}, mode: 'TOOLS' }),
    /Client does not match the required structure/
  );

  const logs = [];
  const instructor = Instructor({
    client: createMockClient(),
    mode: 'JSON_SCHEMA',
    logger: (level, ...args) => logs.push(`${level}:${args.join(' ')}`),
  });

  assert.strictEqual(instructor.provider, 'OAI');
  assert.ok(logs.some((entry) => entry.startsWith('warn:')));

  return 'PASS: constructor validates client shape and warns for unsupported provider mode';
};
