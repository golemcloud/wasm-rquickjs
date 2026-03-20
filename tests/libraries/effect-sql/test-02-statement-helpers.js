import assert from "assert";
import * as Statement from "@effect/sql/Statement";

export const run = () => {
  const transforms = Statement.defaultTransforms((key) => key.toUpperCase(), true);
  const transformed = transforms.object({
    user_id: 1,
    profile_data: {
      display_name: "Alice",
    },
  });

  assert.deepStrictEqual(transformed, {
    USER_ID: 1,
    PROFILE_DATA: {
      DISPLAY_NAME: "Alice",
    },
  });

  const escaped = Statement.defaultEscape('"')("public.users");
  assert.strictEqual(escaped, '"public"."users"');

  assert.strictEqual(Statement.primitiveKind(new Uint8Array([1, 2])), "Uint8Array");
  assert.strictEqual(Statement.primitiveKind(new Date()), "Date");

  const isMarker = Statement.isCustom("marker");
  const customFragment = Statement.custom("marker")({ scope: "test" }, null, null);
  assert.ok(Statement.isFragment(customFragment));
  assert.ok(isMarker(customFragment.segments[0]));

  return "PASS: Statement helpers transform rows and identify fragments";
};
