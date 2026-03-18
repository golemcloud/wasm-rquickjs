import assert from "assert";
import TurndownService from "turndown";

export const run = () => {
  const service = new TurndownService();
  const markdown = service.turndown("<ol start=\"5\"><li>Five</li><li>Six</li></ol>");

  assert.strictEqual(markdown, "5.  Five\n6.  Six");
  return "PASS: ordered lists respect the start attribute";
};
