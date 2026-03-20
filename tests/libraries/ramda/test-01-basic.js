import assert from "assert";
import * as R from "ramda";

export const run = () => {
  const users = [
    { name: "alice", active: true, score: 7 },
    { name: "bob", active: false, score: 10 },
    { name: "claire", active: true, score: 3 },
  ];

  const pipeline = R.pipe(
    R.filter(R.propEq(true, "active")),
    R.map(R.evolve({ name: R.toUpper })),
    R.sortBy(R.prop("score")),
    R.pluck("name")
  );

  assert.deepStrictEqual(pipeline(users), ["CLAIRE", "ALICE"]);
  return "PASS: core pipeline transforms collections";
};
