import assert from "assert";
import { File, Storage } from "@google-cloud/storage";

export const run = () => {
  const storage = new Storage({ projectId: "demo-project" });

  const gsFile = File.from("gs://demo-bucket/path/to/object.txt", storage);
  assert.strictEqual(gsFile.bucket.name, "demo-bucket");
  assert.strictEqual(gsFile.name, "path/to/object.txt");

  const httpsFile = File.from("https://storage.googleapis.com/demo-bucket/path/to/object.txt", storage);
  assert.strictEqual(httpsFile.bucket.name, "demo-bucket");
  assert.strictEqual(httpsFile.name, "path/to/object.txt");

  assert.throws(() => File.from("not-a-url", storage), /url string/i);

  return "PASS: File.from parses gs:// and https URLs and rejects invalid ones";
};
