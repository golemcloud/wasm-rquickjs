import assert from "assert";
import { Graph } from "falkordb";

export const run = async () => {
  const fakeClient = {
    async query() {
      return {
        headers: [[0, "name"], [0, "age"], [0, "active"], [0, "score"], [0, "tags"], [0, "meta"], [0, "point"], [0, "vec"]],
        data: [[
          [2, "Alice"],
          [3, 42],
          [4, "true"],
          [5, "4.5"],
          [6, [[2, "dev"], [3, 7]]],
          [10, ["env", [2, "test"], "tries", [3, 1]]],
          [11, ["47.5", "19.0"]],
          [12, ["1.5", "2.25"]],
        ]],
        metadata: ["OK"],
      };
    },
  };

  const graph = new Graph(fakeClient, "offline");
  const result = await graph.query("MATCH (n) RETURN n");

  assert.strictEqual(result.data.length, 1);
  const row = result.data[0];
  assert.strictEqual(row.name, "Alice");
  assert.strictEqual(row.age, 42);
  assert.strictEqual(row.active, true);
  assert.strictEqual(row.score, 4.5);
  assert.deepStrictEqual(row.tags, ["dev", 7]);
  assert.deepStrictEqual(row.meta, { env: "test", tries: 1 });
  assert.deepStrictEqual(row.point, { latitude: 47.5, longitude: 19 });
  assert.deepStrictEqual(row.vec, [1.5, 2.25]);

  return "PASS: Graph.query parses scalar, array, map, point, and vector values";
};
