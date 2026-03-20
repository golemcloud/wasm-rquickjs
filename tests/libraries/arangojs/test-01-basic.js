import assert from "node:assert";
import { aql } from "arangojs";

export const run = () => {
  const status = "active";
  const minAge = 21;
  const query = aql`FOR u IN users FILTER u.status == ${status} && u.age >= ${minAge} RETURN u`;

  assert.strictEqual(
    query.query,
    "FOR u IN users FILTER u.status == @value0 && u.age >= @value1 RETURN u",
  );
  assert.deepStrictEqual(query.bindVars, { value0: "active", value1: 21 });

  return "PASS: aql builds query text and bind variables";
};
