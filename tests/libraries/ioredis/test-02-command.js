import assert from "assert";
import { Command } from "ioredis";

export const run = () => {
  const command = new Command("set", ["my-key", "my-value"]);

  const encoded = command.toWritable();
  assert.ok(encoded.startsWith("*3\r\n"));
  assert.ok(encoded.includes("$3\r\nset\r\n"));
  assert.ok(encoded.includes("$6\r\nmy-key\r\n"));
  assert.ok(encoded.includes("$8\r\nmy-value\r\n"));

  const hset = new Command("hset", ["user:1", { name: "alice", role: "admin" }]);
  assert.deepStrictEqual(hset.args, ["user:1", "name", "alice", "role", "admin"]);

  return "PASS: Command RESP encoding and argument transformers work";
};
