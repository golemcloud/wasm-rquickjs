import assert from "assert";
import * as R from "ramda";

export const run = () => {
  const original = {
    account: {
      profile: { visits: 2, city: "Berlin" },
    },
  };

  const visitsLens = R.lensPath(["account", "profile", "visits"]);
  const updated = R.over(visitsLens, R.inc, original);

  assert.strictEqual(R.view(visitsLens, updated), 3);
  assert.strictEqual(R.view(visitsLens, original), 2);

  const moved = R.assocPath(["account", "profile", "city"], "Vienna", updated);
  assert.strictEqual(R.path(["account", "profile", "city"], moved), "Vienna");
  assert.strictEqual(R.path(["account", "profile", "city"], updated), "Berlin");

  return "PASS: lens and immutable object path updates work";
};
