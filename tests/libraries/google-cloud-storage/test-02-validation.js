import assert from "assert";
import { Storage } from "@google-cloud/storage";

export const run = async () => {
  const storage = new Storage({ projectId: "demo-project" });

  assert.throws(() => storage.bucket(""), /bucket name/i);
  assert.throws(() => storage.hmacKey(""), /access id/i);
  await assert.rejects(() => storage.createBucket(""), /name is required to create a bucket/i);

  const bucket = storage.bucket("demo-bucket");
  const file = bucket.file("hello.txt");

  await assert.rejects(() => file.copy(), /destination file should have a name/i);
  await assert.rejects(() => bucket.combine([], "combined.txt"), /must provide at least one source file/i);

  return "PASS: core validation and error paths work";
};
