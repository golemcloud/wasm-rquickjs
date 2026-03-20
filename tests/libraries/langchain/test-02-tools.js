import assert from "assert";
import { DynamicTool, tool } from "langchain";

export const run = async () => {
  const uppercase = new DynamicTool({
    name: "uppercase",
    description: "Uppercases text",
    func: async (value) => String(value).toUpperCase(),
  });

  assert.strictEqual(await uppercase.invoke("langchain"), "LANGCHAIN");

  const add = tool(({ a, b }) => a + b, {
    name: "add",
    description: "Adds two numbers",
    schema: {
      type: "object",
      properties: {
        a: { type: "number" },
        b: { type: "number" },
      },
      required: ["a", "b"],
    },
  });

  assert.strictEqual(await add.invoke({ a: 19, b: 23 }), 42);

  return "PASS: DynamicTool and tool() invocation work";
};
