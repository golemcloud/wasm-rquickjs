import assert from 'node:assert';
import chalk from 'chalk';
import { z } from 'zod';
import { parse as parseUuid, stringify as stringifyUuid, v5 as uuidv5, validate as validateUuid } from 'uuid';

export const run = () => {
  assert.strictEqual(chalk.red('plain'), 'plain');

  const schema = z.object({ id: z.string().uuid(), tags: z.array(z.string()).default([]) });
  const id = uuidv5('installed-app', uuidv5.URL);
  const parsed = schema.parse({ id });
  assert.deepStrictEqual(parsed, { id, tags: [] });
  assert.strictEqual(validateUuid(id), true);
  assert.strictEqual(stringifyUuid(parseUuid(id)), id);
  return 'PASS: modern ESM and exports-heavy packages load from node_modules';
};
