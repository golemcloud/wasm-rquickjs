import assert from "assert";
import { Graph } from "falkordb";

export const run = async () => {
  const seenQueries = [];

  const fakeClient = {
    async query(_graphName, query) {
      seenQueries.push(query);
      return "OK";
    },
  };

  const graph = new Graph(fakeClient, "offline");

  await graph.createNodeRangeIndex("User", "name", "email");
  await graph.createNodeVectorIndex("Embedding", 3, "cosine", "embedding");
  await graph.dropEdgeFulltextIndex("KNOWS", "note");

  assert.deepStrictEqual(seenQueries, [
    "CREATE INDEX FOR (e:User) ON (e.name, e.email)",
    "CREATE VECTOR INDEX FOR (e:Embedding) ON (e.embedding) OPTIONS {dimension:3, similarityFunction:'cosine'}",
    "DROP FULLTEXT INDEX FOR ()-[e:KNOWS]->() ON (e.note)",
  ]);

  return "PASS: Graph index helper APIs generate expected Cypher DDL";
};
