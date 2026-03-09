import assert from "assert";
import Ajv from "ajv";

export const run = () => {
  const ajv = new Ajv({ allErrors: true });

  ajv.addFormat("kebab-case", /^[a-z]+(?:-[a-z]+)*$/);
  ajv.addKeyword({
    keyword: "multipleOfField",
    type: "number",
    schemaType: "string",
    validate: (fieldName, value, _parentSchema, dataCtx) => {
      const parent = dataCtx?.parentData;
      return typeof parent?.[fieldName] === "number" && value % parent[fieldName] === 0;
    },
  });

  const validate = ajv.compile({
    type: "object",
    properties: {
      slug: { type: "string", format: "kebab-case" },
      base: { type: "number" },
      multiplier: { type: "number", multipleOfField: "base" },
    },
    required: ["slug", "base", "multiplier"],
    additionalProperties: false,
  });

  assert.strictEqual(validate({ slug: "hello-world", base: 6, multiplier: 24 }), true);

  assert.strictEqual(validate({ slug: "HelloWorld", base: 6, multiplier: 25 }), false);
  assert.ok(validate.errors?.some((error) => error.keyword === "format"));
  assert.ok(validate.errors?.some((error) => error.keyword === "multipleOfField"));

  return "PASS: custom formats and custom keywords work";
};
