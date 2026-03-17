import './genkit-setup.js';
import assert from 'assert';
import { parseSchema, validateSchema, z } from '@genkit-ai/core/schema';

export const run = () => {
  const schema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1),
  });

  const ok = validateSchema({ id: 42, name: 'genkit' }, { schema });
  assert.strictEqual(ok.valid, true);

  const bad = validateSchema({ id: '42', name: '' }, { schema });
  assert.strictEqual(bad.valid, false);

  const parsed = parseSchema({ id: 7, name: 'runtime' }, { schema });
  assert.deepStrictEqual(parsed, { id: 7, name: 'runtime' });

  assert.throws(() => parseSchema({ id: 0, name: '' }, { schema }));

  return 'PASS: schema validation and parsing work for valid and invalid data';
};
