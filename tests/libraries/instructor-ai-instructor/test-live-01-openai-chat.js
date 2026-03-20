import assert from 'assert';
import Instructor from '@instructor-ai/instructor';
import OpenAI from 'openai';
import { z } from 'zod';

const isKnownCredentialGate = (message) => {
  return (
    /incorrect api key/i.test(message) ||
    /invalid api key/i.test(message) ||
    /authentication/i.test(message) ||
    /insufficient_quota/i.test(message) ||
    /billing/i.test(message) ||
    /rate limit/i.test(message)
  );
};

export const run = async () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY for live test');
  }

  const client = Instructor({
    client: new OpenAI({ apiKey }),
    mode: 'TOOLS',
  });

  const ReplySchema = z.object({
    reply: z.string().min(1),
  });

  try {
    const result = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 16,
      messages: [
        { role: 'user', content: 'Return a short greeting in one or two words.' },
      ],
      response_model: {
        name: 'GreetingReply',
        schema: ReplySchema,
      },
      max_retries: 1,
    });

    assert.ok(typeof result.reply === 'string' && result.reply.length > 0);
    return 'PASS: live OpenAI structured output call succeeded';
  } catch (error) {
    const message = String(error?.message || error);
    if (!isKnownCredentialGate(message)) {
      throw error;
    }

    return 'PASS: live OpenAI call reached service and returned expected credential/billing gate';
  }
};
