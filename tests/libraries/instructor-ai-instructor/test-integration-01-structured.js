import assert from 'assert';
import Instructor from '@instructor-ai/instructor';
import OpenAI from 'openai';
import { z } from 'zod';

export const run = async () => {
  const client = Instructor({
    client: new OpenAI({
      apiKey: 'test-key',
      baseURL: 'http://localhost:18080/v1',
    }),
    mode: 'TOOLS',
  });

  const Person = z.object({
    name: z.string(),
    age: z.number(),
  });

  const result = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'INTEGRATION_STRUCTURED: extract a person' }],
    response_model: {
      name: 'ExtractPerson',
      schema: Person,
    },
  });

  assert.strictEqual(result.name, 'Grace Hopper');
  assert.strictEqual(result.age, 85);
  assert.strictEqual(result._meta.usage.total_tokens, 18);

  return 'PASS: TOOLS mode parses structured JSON payload over real HTTP transport';
};
