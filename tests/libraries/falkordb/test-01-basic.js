import assert from "assert";
import { ConstraintType, EntityType, FalkorDB, Graph } from "falkordb";

export const run = () => {
  assert.strictEqual(typeof FalkorDB.connect, "function");
  assert.strictEqual(typeof Graph, "function");

  assert.strictEqual(ConstraintType.MANDATORY, "MANDATORY");
  assert.strictEqual(ConstraintType.UNIQUE, "UNIQUE");
  assert.strictEqual(EntityType.NODE, "NODE");
  assert.strictEqual(EntityType.RELATIONSHIP, "RELATIONSHIP");

  const graphMethods = Object.getOwnPropertyNames(Graph.prototype);
  assert.ok(graphMethods.includes("query"));
  assert.ok(graphMethods.includes("roQuery"));
  assert.ok(graphMethods.includes("createNodeVectorIndex"));
  assert.ok(graphMethods.includes("constraintCreate"));

  return "PASS: falkordb exports expected classes, enums, and graph APIs";
};
