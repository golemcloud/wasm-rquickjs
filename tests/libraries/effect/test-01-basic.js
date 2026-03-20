import assert from "assert";
import { Data, Either, Equal, Hash, Option } from "effect";

export const run = () => {
  const some = Option.some(42);
  const none = Option.none();
  assert.strictEqual(Option.isSome(some), true);
  assert.strictEqual(Option.isNone(none), true);
  assert.strictEqual(Option.getOrElse(some, () => 0), 42);

  const right = Either.right("ok");
  const left = Either.left("boom");
  assert.strictEqual(Either.isRight(right), true);
  assert.strictEqual(Either.isLeft(left), true);

  const userA = Data.struct({ id: 1, name: "Ada" });
  const userB = Data.struct({ id: 1, name: "Ada" });
  assert.strictEqual(Equal.equals(userA, userB), true);
  assert.strictEqual(Hash.hash(userA), Hash.hash(userB));

  return "PASS: Option/Either/Data primitives work";
};
