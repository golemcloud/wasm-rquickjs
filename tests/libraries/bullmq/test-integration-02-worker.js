import assert from "assert";
import { Queue, Worker } from "bullmq";

export const run = async () => {
  const connection = { host: "127.0.0.1", port: 63792 };
  const queueName = "test-worker-" + Date.now();
  const queue = new Queue(queueName, { connection });

  const processed = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("worker timed out after 15s")), 15000);

    const worker = new Worker(
      queueName,
      async (job) => {
        return { doubled: job.data.value * 2 };
      },
      { connection }
    );

    worker.on("completed", (job) => {
      clearTimeout(timeout);
      resolve({ worker, job });
    });

    worker.on("failed", (job, err) => {
      clearTimeout(timeout);
      reject(new Error("job failed: " + err.message));
    });

    worker.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error("worker error: " + err.message));
    });
  });

  try {
    await queue.add("compute", { value: 21 });

    const { worker, job } = await processed;
    assert.ok(job.id, "completed job should have an id");
    assert.strictEqual(job.returnvalue.doubled, 42, "worker should return doubled value");

    await worker.close();
    return "PASS: Worker processes job and returns correct result";
  } finally {
    await queue.close();
  }
};
