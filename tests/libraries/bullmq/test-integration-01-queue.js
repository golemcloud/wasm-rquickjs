import assert from "assert";
import { Queue } from "bullmq";

export const run = async () => {
  const connection = { host: "127.0.0.1", port: 63792 };
  const queueName = "test-queue-" + Date.now();
  const queue = new Queue(queueName, { connection });

  try {
    const job = await queue.add("test-job", { foo: "bar", num: 42 });
    assert.ok(job.id, "job should have an id");
    assert.strictEqual(job.name, "test-job", "job name should match");

    const fetched = await queue.getJob(job.id);
    assert.ok(fetched, "getJob should return the job");
    assert.deepStrictEqual(fetched.data, { foo: "bar", num: 42 }, "job data should match");

    const counts = await queue.getJobCounts("wait", "active", "completed", "failed");
    assert.strictEqual(counts.wait, 1, "should have 1 waiting job");
    assert.strictEqual(counts.active, 0, "should have 0 active jobs");

    return "PASS: Queue add, getJob, and getJobCounts work correctly";
  } finally {
    await queue.close();
  }
};
