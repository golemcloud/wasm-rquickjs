import assert from "node:assert";
import { aql, isAqlLiteral, isAqlQuery, isGeneratedAqlQuery, join, literal } from "arangojs/aql";

export const run = () => {
  const sortDirection = literal("SORT u.name ASC");
  const filters = join([aql`FILTER u.active == ${true}`, aql`FILTER u.age < ${50}`], " ");

  assert.strictEqual(isAqlLiteral(sortDirection), true);
  assert.strictEqual(sortDirection.toAQL(), "SORT u.name ASC");

  assert.strictEqual(isAqlQuery(filters), true);
  assert.strictEqual(isGeneratedAqlQuery(filters), true);
  assert.strictEqual(filters.query, "FILTER u.active == @value0 FILTER u.age < @value1");
  assert.deepStrictEqual(filters.bindVars, { value0: true, value1: 50 });

  return "PASS: aql literal/join/query type guards behave as expected";
};
