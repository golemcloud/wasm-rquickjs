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
    messages: [{ role: 'user', content: 'INTEGRATION_RETRY: first response should fail validation' }],
    response_model: {
      name: 'ExtractPerson',
      schema: Person,
    },
    max_retries: 1,
  });

  assert.strictEqual(result.name, 'Ada Lovelace');
  assert.strictEqual(result.age, 36);

  return 'PASS: validation failure over HTTP triggers retry and succeeds on second response';
};
