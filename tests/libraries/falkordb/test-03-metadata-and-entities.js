import assert from "assert";
import { Graph } from "falkordb";

export const run = async () => {
  const roQueryCalls = [];

  const fakeClient = {
    async query() {
      return {
        headers: [[0, "node"], [0, "edge"]],
        data: [[
          [8, [11, [0], [[0, 2, "Ada"], [1, 3, 36]]]],
          [7, [22, 0, 11, 12, [[2, 2, "met at conference"]]]],
        ]],
        metadata: ["OK"],
      };
    },
    async roQuery(_graphName, q) {
      roQueryCalls.push(q);
      if (q === "CALL db.labels()") return { data: [["Person"]] };
      if (q === "CALL db.relationshipTypes()") return { data: [["KNOWS"]] };
      if (q === "CALL db.propertyKeys()") return { data: [["name"], ["age"], ["note"]] };
      throw new Error(`Unexpected metadata query: ${q}`);
    },
  };

  const graph = new Graph(fakeClient, "offline");
  const result = await graph.query("MATCH (n)-[r]->() RETURN n, r");

  assert.strictEqual(roQueryCalls.length, 3);
  assert.deepStrictEqual(roQueryCalls, [
    "CALL db.labels()",
    "CALL db.relationshipTypes()",
    "CALL db.propertyKeys()",
  ]);

  const row = result.data[0];
  assert.strictEqual(row.node.id, 11);
  assert.deepStrictEqual(row.node.labels, ["Person"]);
  assert.deepStrictEqual(row.node.properties, { name: "Ada", age: 36 });

  assert.strictEqual(row.edge.id, 22);
  assert.strictEqual(row.edge.relationshipType, "KNOWS");
  assert.strictEqual(row.edge.sourceId, 11);
  assert.strictEqual(row.edge.destinationId, 12);
  assert.deepStrictEqual(row.edge.properties, { note: "met at conference" });

  return "PASS: Graph metadata lookup resolves node labels, relationship types, and property keys";
};
