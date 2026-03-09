import assert from "assert";
import { initChatModel } from "langchain";

export const run = async () => {
  let threw = false;

  try {
    await initChatModel("gpt-4o-mini", { modelProvider: "openai" });
  } catch (error) {
    threw = true;
    const message = String(error?.message ?? error);
    assert.ok(
      message.includes("Unable to import @langchain/openai"),
      `Unexpected initChatModel error: ${message}`,
    );
  }

  assert.strictEqual(threw, true, "Expected initChatModel to throw without provider package");

  return "PASS: initChatModel reports missing provider integration package";
};
