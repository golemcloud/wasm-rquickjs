import assert from "assert";
import { anthropic } from "@ai-sdk/anthropic";

export const run = () => {
  assert.strictEqual(typeof anthropic.tools, "object");

  const computerToolFactory = anthropic.tools.computer_20241022;
  const bashToolFactory = anthropic.tools.bash_20241022;
  const textEditorToolFactory = anthropic.tools.textEditor_20241022;

  assert.strictEqual(typeof computerToolFactory, "function");
  assert.strictEqual(typeof bashToolFactory, "function");
  assert.strictEqual(typeof textEditorToolFactory, "function");

  const computer = computerToolFactory({ displayWidthPx: 1024, displayHeightPx: 768 });
  const bash = bashToolFactory({});
  const textEditor = textEditorToolFactory({});

  assert.strictEqual(computer.type, "provider");
  assert.strictEqual(bash.type, "provider");
  assert.strictEqual(textEditor.type, "provider");

  assert.ok(typeof computer.id === "string" && computer.id.includes("computer"));
  assert.ok(typeof bash.id === "string" && bash.id.includes("bash"));
  assert.ok(typeof textEditor.id === "string" && textEditor.id.includes("text_editor"));

  return "PASS: anthropic.tools exposes provider tool descriptor factories";
};
