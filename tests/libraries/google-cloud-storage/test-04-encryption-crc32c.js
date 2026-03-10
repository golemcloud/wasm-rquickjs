import assert from "assert";
import { Storage } from "@google-cloud/storage";

export const run = () => {
  const storage = new Storage({ projectId: "demo-project" });
  const file = storage.bucket("demo-bucket").file("secure.bin");

  const key = Buffer.from("01234567890123456789012345678901");
  file.setEncryptionKey(key);

  assert.ok(file.encryptionKeyBase64);
  assert.ok(file.encryptionKeyHash);
  assert.notStrictEqual(file.encryptionKeyBase64.length, 0);
  assert.notStrictEqual(file.encryptionKeyHash.length, 0);

  const crc = storage.crc32cGenerator();
  crc.update(Buffer.from("data"));
  const digest = crc.toString();

  assert.strictEqual(crc.validate(digest), true);
  assert.strictEqual(typeof digest, "string");
  assert.notStrictEqual(digest.length, 0);

  return "PASS: encryption key hashing and CRC32C generation work offline";
};
