import assert from "assert";
import { cosineSimilarity, isDeepEqualData } from "ai";

export const run = () => {
  const identical = cosineSimilarity([1, 2, 3], [1, 2, 3]);
  assert.ok(Math.abs(identical - 1) < 1e-10);

  const orthogonal = cosineSimilarity([1, 0], [0, 1]);
  assert.ok(Math.abs(orthogonal) < 1e-10);

  const left = { a: [1, { b: "x" }], c: { d: true } };
  const right = { a: [1, { b: "x" }], c: { d: true } };
  const different = { a: [1, { b: "y" }], c: { d: true } };

  assert.ok(isDeepEqualData(left, right));
  assert.ok(!isDeepEqualData(left, different));

  return "PASS: cosineSimilarity and isDeepEqualData handle core cases";
};
