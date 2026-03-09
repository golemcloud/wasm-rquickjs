import assert from "assert";
import Ajv from "ajv";

export const run = () => {
  const ajv = new Ajv({
    useDefaults: true,
    removeAdditional: true,
    coerceTypes: true,
  });

  const validate = ajv.compile({
    type: "object",
    properties: {
      count: { type: "integer", default: 1 },
      enabled: { type: "boolean", default: false },
      tags: { type: "array", items: { type: "string" }, default: [] },
    },
    additionalProperties: false,
  });

  const data = { count: "3", enabled: "true", extra: "drop-me" };

  assert.strictEqual(validate(data), true);
  assert.deepStrictEqual(data, {
    count: 3,
    enabled: true,
    tags: [],
  });

  return "PASS: coercion, defaults, and additional-property removal work";
};
