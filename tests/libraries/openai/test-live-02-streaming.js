import assert from 'assert';
import OpenAI from 'openai';

export const run = async () => {
  const apiKey = process.env.OPENAI_API_KEY || 'missing-openai-api-key';

  const client = new OpenAI({ apiKey });

  const stream = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Reply with exactly STREAM_TEST_MARKER' }],
    temperature: 0,
    max_tokens: 20,
    stream: true,
  });

  const chunks = [];
  for await (const chunk of stream) {
    if (chunk.choices[0]?.delta?.content) {
      chunks.push(chunk.choices[0].delta.content);
    }
  }

  assert.ok(chunks.length > 0, 'Expected at least one content chunk');
  const fullText = chunks.join('').trim();
  assert.ok(fullText.includes('STREAM_TEST_MARKER'), `Unexpected streamed output: ${fullText}`);

  return 'PASS: live streaming chat completion delivers chunks with expected marker';
};
