import assert from "assert";
import TurndownService from "turndown";

export const run = () => {
  const service = new TurndownService({
    codeBlockStyle: "fenced",
    fence: "```",
  });

  const markdown = service.turndown(
    '<pre><code class="language-js">const x = 1;\nconsole.log(x);</code></pre>',
  );

  assert.strictEqual(markdown, "```js\nconst x = 1;\nconsole.log(x);\n```");
  return "PASS: fenced code blocks preserve language and content";
};
