import assert from "assert";
import async from "async";

export const run = async () => {
  const processed = [];
  let active = 0;
  let maxActive = 0;

  const queue = async.queue(async (task) => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    await new Promise((resolve) => setTimeout(resolve, 1));
    processed.push(task.id);
    active -= 1;
  }, 2);

  await Promise.all([1, 2, 3, 4, 5].map((id) => queue.pushAsync({ id })));

  assert.deepStrictEqual([...processed].sort((a, b) => a - b), [1, 2, 3, 4, 5]);
  assert.ok(maxActive <= 2);
  assert.strictEqual(queue.idle(), true);

  const batches = [];
  const cargo = async.cargo(async (tasks) => {
    batches.push(tasks.map((task) => task.id));
  }, 2);

  await Promise.all([1, 2, 3, 4, 5].map((id) => cargo.pushAsync({ id })));

  assert.deepStrictEqual(batches.flat().sort((a, b) => a - b), [1, 2, 3, 4, 5]);
  assert.ok(batches.every((batch) => batch.length <= 2));

  return "PASS: queue and cargo concurrency primitives work";
};
