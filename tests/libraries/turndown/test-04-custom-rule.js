import assert from "assert";
import TurndownService from "turndown";

export const run = () => {
  const service = new TurndownService();
  service.addRule("superscript", {
    filter: "sup",
    replacement: (content) => `^(${content})`,
  });

  const markdown = service.turndown("<p>Water is H<sup>2</sup>O.</p>");

  assert.strictEqual(markdown, "Water is H^(2)O.");
  return "PASS: addRule() custom replacement is applied";
};
