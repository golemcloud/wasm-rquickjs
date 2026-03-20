import assert from "assert";
import { Schema } from "effect";

const User = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  tags: Schema.Array(Schema.String),
});

export const run = () => {
  const decode = Schema.decodeUnknownSync(User);
  const encode = Schema.encodeSync(User);

  const user = decode({ id: 1, name: "Ada", tags: ["admin", "author"] });
  assert.deepStrictEqual(user, { id: 1, name: "Ada", tags: ["admin", "author"] });

  assert.throws(() => decode({ id: "1", name: "Ada", tags: [] }), /Expected number/);

  const encoded = encode(user);
  assert.deepStrictEqual(encoded, { id: 1, name: "Ada", tags: ["admin", "author"] });

  return "PASS: Schema decode/encode and validation work";
};
