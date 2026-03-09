import assert from "assert";
import { Connection, Client } from "@temporalio/client";

export const run = async () => {
  const connection = Connection.lazy({
    address: "localhost:7233",
    apiKey: "demo-key",
  });

  assert.strictEqual(typeof connection.close, "function");
  assert.strictEqual(typeof connection.withMetadata, "function");
  assert.strictEqual(typeof connection.withDeadline, "function");
  assert.strictEqual(typeof connection.withAbortSignal, "function");

  const result = await connection.withMetadata({ "x-test": "1" }, async () => "ok");
  assert.strictEqual(result, "ok");

  const client = new Client({
    connection,
    namespace: "default",
    identity: "library-test",
  });

  assert.strictEqual(typeof client.workflow.start, "function");
  assert.strictEqual(typeof client.workflow.execute, "function");
  assert.strictEqual(typeof client.schedule.create, "function");

  await connection.close();

  return "PASS: lazy connection and client construction work without contacting a server";
};
