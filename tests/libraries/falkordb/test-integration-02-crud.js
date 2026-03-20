import assert from "assert";
import { FalkorDB } from "falkordb";

export const run = async () => {
  let db;
  const graphName = "amp_falkordb_graph";

  try {
    db = await FalkorDB.connect({
      url: "redis://127.0.0.1:63795",
      connectTimeout: 5000,
    });

    const graph = db.selectGraph(graphName);

    try {
      await graph.delete();
    } catch {
      // Ignore: graph may not exist yet.
    }

    await graph.query(
      "CREATE (a:Person {name: 'Alice', age: 30}), (b:Person {name: 'Bob', age: 28}), (a)-[:KNOWS {since: 2020}]->(b)"
    );

    const result = await graph.query(
      "MATCH (a:Person)-[r:KNOWS]->(b:Person) RETURN a.name AS fromName, b.name AS toName, r.since AS since"
    );

    assert.strictEqual(result.data.length, 1);
    assert.strictEqual(result.data[0].fromName, "Alice");
    assert.strictEqual(result.data[0].toName, "Bob");
    assert.strictEqual(result.data[0].since, 2020);

    await graph.createNodeRangeIndex("Person", "name");
    await graph.dropNodeRangeIndex("Person", "name");

    await graph.delete();

    return "PASS: graph CRUD queries and index create/drop work against FalkorDB";
  } finally {
    if (db) {
      await db.close();
    }
  }
};
