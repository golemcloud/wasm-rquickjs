import assert from "assert";
import { InMemoryStore } from "langchain";

export const run = async () => {
  const store = new InMemoryStore();

  await store.mset([
    ["user:1", { name: "Ada" }],
    ["user:2", { name: "Grace" }],
  ]);

  const [u1, u2, missing] = await store.mget(["user:1", "user:2", "user:3"]);
  assert.deepStrictEqual(u1, { name: "Ada" });
  assert.deepStrictEqual(u2, { name: "Grace" });
  assert.strictEqual(missing, undefined);

  await store.mdelete(["user:1"]);
  const [afterDelete] = await store.mget(["user:1"]);
  assert.strictEqual(afterDelete, undefined);

  return "PASS: InMemoryStore CRUD operations work";
};
