import assert from "assert";
import async from "async";

export const run = async () => {
  const seriesResult = await async.series([
    async () => "alpha",
    async () => "beta",
    async () => "gamma",
  ]);
  assert.deepStrictEqual(seriesResult, ["alpha", "beta", "gamma"]);

  const waterfallResult = await async.waterfall([
    async () => 5,
    async (value) => value * 2,
    async (value) => `result:${value}`,
  ]);
  assert.strictEqual(waterfallResult, "result:10");

  const autoResult = await async.auto({
    base: async () => 3,
    plusTwo: ["base", async ({ base }) => base + 2],
    timesFour: ["plusTwo", async ({ plusTwo }) => plusTwo * 4],
  });
  assert.deepStrictEqual(autoResult, {
    base: 3,
    plusTwo: 5,
    timesFour: 20,
  });

  return "PASS: series/waterfall/auto control flow works";
};
