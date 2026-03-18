import assert from 'assert';
import { Duration, Uuid, surql } from 'surrealdb';

export const run = () => {
  const d1 = Duration.seconds(30);
  const d2 = Duration.seconds(45);
  const sum = d1.add(d2);

  assert.strictEqual(sum.toString(), '1m15s');

  const uuid = Uuid.v4().toString();
  assert.match(uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

  const query = surql`RETURN ${42} AS answer;`;
  assert.ok(query.query.includes('RETURN'));
  assert.ok(Object.values(query.bindings).includes(42));

  return 'PASS: duration math, UUID generation, and SurrealQL template bindings work';
};
