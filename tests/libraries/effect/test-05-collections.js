import assert from "assert";
import { Chunk, HashMap, HashSet, Option } from "effect";

export const run = () => {
  let map = HashMap.empty();
  map = HashMap.set(map, "alpha", 1);
  map = HashMap.set(map, "beta", 2);

  assert.strictEqual(HashMap.size(map), 2);
  assert.strictEqual(HashMap.has(map, "alpha"), true);
  assert.strictEqual(HashMap.has(map, "gamma"), false);

  const betaValue = HashMap.get(map, "beta");
  assert.strictEqual(Option.getOrElse(betaValue, () => 0), 2);

  let set = HashSet.empty();
  set = HashSet.add(set, "a");
  set = HashSet.add(set, "b");
  set = HashSet.add(set, "a");
  assert.strictEqual(HashSet.size(set), 2);

  const chunk = Chunk.map(Chunk.fromIterable([1, 2, 3]), (n) => n * 10);
  assert.strictEqual(Chunk.unsafeGet(chunk, 0), 10);
  assert.strictEqual(Chunk.unsafeGet(chunk, 2), 30);

  return "PASS: HashMap/HashSet/Chunk operations work";
};
