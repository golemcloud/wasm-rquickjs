import assert from "assert";
import Ajv from "ajv";

export const run = () => {
  const ajv = new Ajv({ allErrors: true });

  ajv.addSchema({
    $id: "https://example.com/address.json",
    type: "object",
    properties: {
      city: { type: "string" },
      zip: { type: "integer" },
    },
    required: ["city", "zip"],
    additionalProperties: false,
  });

  const validate = ajv.compile({
    type: "object",
    properties: {
      name: { type: "string" },
      home: { $ref: "https://example.com/address.json" },
      work: { $ref: "https://example.com/address.json" },
    },
    required: ["name", "home"],
    additionalProperties: false,
  });

  assert.strictEqual(validate({ name: "alice", home: { city: "NYC", zip: 10001 } }), true);

  assert.strictEqual(validate({ name: "alice", home: { city: "NYC", zip: "10001" } }), false);
  assert.ok(validate.errors?.some((error) => error.instancePath === "/home/zip" && error.keyword === "type"));

  return "PASS: schema references and shared definitions work";
};
