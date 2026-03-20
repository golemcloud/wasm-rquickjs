import assert from "assert";
import TurndownService from "turndown";

export const run = () => {
  const service = new TurndownService();
  const markdown = service.turndown(
    "<h1>Turndown</h1><p>Hello <em>markdown</em> <strong>world</strong>.</p>",
  );

  assert.strictEqual(markdown, "Turndown\n========\n\nHello _markdown_ **world**.");
  return "PASS: default heading and inline formatting conversion";
};
