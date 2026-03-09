import assert from "assert";
import Ajv, { ValidationError } from "ajv";

export const run = async () => {
  const ajv = new Ajv({ allErrors: true });

  ajv.addKeyword({
    keyword: "notReserved",
    async: true,
    type: "string",
    validate: async (_schema, value) => {
      const reserved = new Set(["admin", "root", "system"]);
      return !reserved.has(value);
    },
  });

  const validate = ajv.compile({
    $async: true,
    type: "object",
    properties: {
      username: { type: "string", notReserved: true },
    },
    required: ["username"],
    additionalProperties: false,
  });

  const validResult = await validate({ username: "alice" });
  assert.deepStrictEqual(validResult, { username: "alice" });

  let rejected = false;
  try {
    await validate({ username: "admin" });
  } catch (error) {
    rejected = true;
    assert.ok(error instanceof ValidationError);
    assert.ok(error.errors?.some((entry) => entry.keyword === "notReserved"));
  }

  assert.strictEqual(rejected, true);
  return "PASS: async keyword validation and ValidationError flow work";
};
