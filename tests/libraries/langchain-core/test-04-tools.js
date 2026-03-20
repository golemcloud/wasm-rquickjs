import assert from "assert";
import { DynamicTool, tool } from "@langchain/core/tools";

export const run = async () => {
  const uppercase = new DynamicTool({
    name: "uppercase",
    description: "Convert input text to uppercase",
    func: async (value) => String(value).toUpperCase(),
  });

  const uppercaseResult = await uppercase.invoke("langchain core");
  assert.strictEqual(uppercaseResult, "LANGCHAIN CORE");

  const add = tool(({ a, b }) => a + b, {
    name: "add",
    description: "Add two numbers",
    schema: {
      type: "object",
      properties: {
        a: { type: "number" },
        b: { type: "number" },
      },
      required: ["a", "b"],
    },
  });

  const sum = await add.invoke({ a: 20, b: 22 });
  assert.strictEqual(sum, 42);

  let validationFailed = false;
  try {
    await add.invoke({ a: 20 });
  } catch (error) {
    validationFailed = true;
    const message = String(error?.message ?? error);
    assert.ok(message.length > 0);
  }
  assert.strictEqual(validationFailed, true, "Expected schema validation failure");

  return "PASS: DynamicTool and schema-validated tool invocation work";
};
