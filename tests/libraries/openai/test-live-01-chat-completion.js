import assert from 'assert';
import OpenAI from 'openai';

export const run = async () => {
  const apiKey = process.env.OPENAI_API_KEY || 'missing-openai-api-key';

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Reply with exactly HELLO_OPENAI_SDK_TEST' }],
    temperature: 0,
    max_tokens: 20,
  });

  assert.ok(completion.id, 'Expected completion to have an id');
  assert.strictEqual(completion.object, 'chat.completion');
  assert.ok(completion.choices.length > 0, 'Expected at least one choice');

  const text = completion.choices[0].message.content.trim();
  assert.ok(text.includes('HELLO_OPENAI_SDK_TEST'), `Unexpected output: ${text}`);

  return 'PASS: live chat.completions.create returns expected marker text';
};
