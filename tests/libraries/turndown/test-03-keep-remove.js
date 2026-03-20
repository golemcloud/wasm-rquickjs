import assert from "assert";
import TurndownService from "turndown";

export const run = () => {
  const service = new TurndownService();
  service.keep(["del"]);
  service.remove("script");

  const markdown = service.turndown(
    "<p>Hello <del>old</del> world<script>alert(1)</script></p>",
  );

  assert.ok(markdown.includes("<del>old</del>"));
  assert.ok(!markdown.includes("alert(1)"));
  assert.strictEqual(markdown, "Hello <del>old</del> world");
  return "PASS: keep() preserves HTML while remove() strips selected tags";
};
