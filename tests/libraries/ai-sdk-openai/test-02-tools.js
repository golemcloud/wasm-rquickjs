import assert from "assert";
import { openai } from "@ai-sdk/openai";

export const run = () => {
  const webSearch = openai.tools.webSearch({ searchContextSize: "medium" });
  const fileSearch = openai.tools.fileSearch({ vectorStoreIds: ["vs_test"] });
  const codeInterpreter = openai.tools.codeInterpreter();
  const imageGeneration = openai.tools.imageGeneration({ size: "1024x1024" });

  assert.strictEqual(typeof webSearch, "object");
  assert.strictEqual(typeof fileSearch, "object");
  assert.strictEqual(typeof codeInterpreter, "object");
  assert.strictEqual(typeof imageGeneration, "object");

  assert.strictEqual(webSearch.type, "provider");
  assert.strictEqual(fileSearch.type, "provider");
  assert.strictEqual(codeInterpreter.type, "provider");
  assert.strictEqual(imageGeneration.type, "provider");

  assert.strictEqual(webSearch.id, "openai.web_search");
  assert.strictEqual(fileSearch.id, "openai.file_search");
  assert.strictEqual(codeInterpreter.id, "openai.code_interpreter");
  assert.strictEqual(imageGeneration.id, "openai.image_generation");

  return "PASS: openai.tools produces expected built-in tool descriptor shapes";
};
