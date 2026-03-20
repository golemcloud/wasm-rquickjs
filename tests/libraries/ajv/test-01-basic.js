import assert from "assert";
import Ajv from "ajv";

export const run = () => {
  const ajv = new Ajv({ allErrors: true });

  const validate = ajv.compile({
    type: "object",
    properties: {
      name: { type: "string", minLength: 1 },
      age: { type: "integer", minimum: 0 },
      active: { type: "boolean" },
    },
    required: ["name", "age"],
    additionalProperties: false,
  });

  assert.strictEqual(validate({ name: "alice", age: 42, active: true }), true);

  assert.strictEqual(validate({ name: "alice" }), false);
  assert.ok(validate.errors?.some((error) => error.keyword === "required" && error.params?.missingProperty === "age"));

  return "PASS: basic schema validation and error reporting works";
};
