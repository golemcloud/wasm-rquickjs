import assert from 'node:assert';
import { assert as structAssert, number, object, string } from 'superstruct';
import * as v from 'valibot';

export const run = () => {
  const StructSchema = object({ name: string(), count: number() });
  structAssert({ name: 'ok', count: 3 }, StructSchema);
  assert.throws(() => structAssert({ name: 'ok', count: 'bad' }, StructSchema));

  const ValibotSchema = v.object({ name: v.string(), count: v.number() });
  assert.deepStrictEqual(v.parse(ValibotSchema, { name: 'ok', count: 3 }), { name: 'ok', count: 3 });
  assert.throws(() => v.parse(ValibotSchema, { name: 'ok', count: 'bad' }));
  return 'PASS: superstruct and valibot ESM validation packages execute from node_modules';
};
