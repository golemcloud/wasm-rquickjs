import assert from "assert";
import { ConstraintType, EntityType, Graph } from "falkordb";

export const run = async () => {
  const calls = [];

  const fakeClient = {
    async roQuery(graphName, query, options) {
      calls.push(["roQuery", graphName, query, options]);
      return {
        headers: [[0, "value"]],
        data: [[[2, "ok"]]],
        metadata: ["OK"],
      };
    },
    async constraintCreate(...args) {
      calls.push(["constraintCreate", ...args]);
      return "OK";
    },
    async constraintDrop(...args) {
      calls.push(["constraintDrop", ...args]);
      return "OK";
    },
    async copy(...args) {
      calls.push(["copy", ...args]);
      return "OK";
    },
    async delete(...args) {
      calls.push(["delete", ...args]);
      return "OK";
    },
    async explain(...args) {
      calls.push(["explain", ...args]);
      return ["Results", "Project"];
    },
    async profile(...args) {
      calls.push(["profile", ...args]);
      return ["Profile"];
    },
    async memoryUsage(...args) {
      calls.push(["memoryUsage", ...args]);
      return 123;
    },
    async slowLog(...args) {
      calls.push(["slowLog", ...args]);
      return [];
    },
  };

  const graph = new Graph(fakeClient, "myGraph");

  const roResult = await graph.roQuery("MATCH (n) RETURN 'ok' AS value", { TIMEOUT: 250 });
  assert.strictEqual(roResult.data[0].value, "ok");

  await graph.constraintCreate(ConstraintType.UNIQUE, EntityType.NODE, "User", "email");
  await graph.constraintDrop(ConstraintType.UNIQUE, EntityType.NODE, "User", "email");
  await graph.copy("myGraphCopy");
  await graph.delete();
  await graph.explain("MATCH (n) RETURN n");
  await graph.profile("MATCH (n) RETURN n");
  await graph.memoryUsage({ samples: true });
  await graph.slowLog();

  assert.deepStrictEqual(calls, [
    ["roQuery", "myGraph", "MATCH (n) RETURN 'ok' AS value", { TIMEOUT: 250 }],
    ["constraintCreate", "myGraph", "UNIQUE", "NODE", "User", "email"],
    ["constraintDrop", "myGraph", "UNIQUE", "NODE", "User", "email"],
    ["copy", "myGraph", "myGraphCopy"],
    ["delete", "myGraph"],
    ["explain", "myGraph", "MATCH (n) RETURN n"],
    ["profile", "myGraph", "MATCH (n) RETURN n"],
    ["memoryUsage", "myGraph", { samples: true }],
    ["slowLog", "myGraph"],
  ]);

  return "PASS: Graph command APIs forward arguments to client with graph name";
};
