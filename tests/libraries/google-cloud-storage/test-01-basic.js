import assert from "assert";
import { Storage } from "@google-cloud/storage";

export const run = () => {
  const storage = new Storage({ projectId: "demo-project" });
  const bucket = storage.bucket("gs://demo-bucket/");
  const file = bucket.file("path/to/object.txt", {
    generation: "7",
    userProject: "billing-project",
  });

  assert.strictEqual(bucket.name, "demo-bucket");
  assert.strictEqual(bucket.cloudStorageURI.href, "gs://demo-bucket");

  assert.strictEqual(file.name, "path/to/object.txt");
  assert.strictEqual(file.bucket.name, "demo-bucket");
  assert.strictEqual(file.cloudStorageURI.href, "gs://demo-bucket/path/to/object.txt");
  assert.strictEqual(file.generation, 7);
  assert.strictEqual(file.userProject, "billing-project");

  return "PASS: Storage/Bucket/File construction and URI parsing work";
};
